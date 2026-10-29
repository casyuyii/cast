---
title: "mutex"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/d63fd502935e4256b8df917dc8c0a12b"
---

距离上次更新已经很久了 = =

先声明! 在下没有摸鱼!(没有纯粹摸鱼...) 而是在和源码鏖战(单方面被虐QAQ...)

都快生出了... 我是不是放弃比较好啊. 当个咸鱼程序如何? 反正源码又很少在业务代码中用到. 之类的想法.

这段时间写不出任何东西的原因主要还是 **实在太多了!!!!**

密密麻麻. 填不完的窟窿. 转个几圈一知半解又得回去...

这份代码应该是在描述多 CPU 情况下, 获取 SPIN 锁的过程.

这个函数有意思之处在于, 它用队列的形式, 避免了显式锁的获取. 以保证互斥性.

```c
/*
 * Optimistic spinning.
 *
 * We try to spin for acquisition when we find that the lock owner
 * is currently running on a (different) CPU and while we don't
 * need to reschedule. The rationale is that if the lock owner is
 * running, it is likely to release the lock soon.
 *
 * The mutex spinners are queued up using MCS lock so that only one
 * spinner can compete for the mutex. However, if mutex spinning isn't
 * going to happen, there is no point in going through the lock/unlock
 * overhead.
 *
 * Returns true when the lock was taken, otherwise false, indicating
 * that we need to jump to the slowpath and sleep.
 *
 * The waiter flag is set to true if the spinner is a waiter in the wait
 * queue. The waiter-spinner will spin on the lock directly and concurrently
 * with the spinner at the head of the OSQ, if present, until the owner is
 * changed to itself.
 */
static __always_inline bool
// 在看代码时, lock 为全局变量. 即: 全局锁.
// 我是从 kmem_cache_create_usercopy (即: 内核创建缓存)函数中找到的
// 而这个函数我又是从 fork 中的一个变量索引过来的, 这个变量的所需内存就在上面
// 这个函数中创建; 创建时, 需要获取锁, 而下面的函数, 则是其中获取锁中的部分代码;
// 其余全部参数均为空;
mutex_optimistic_spin(struct mutex *lock, struct ww_acquire_ctx *ww_ctx,
		      const bool use_ww_ctx, struct mutex_waiter *waiter)
{
	if (!waiter) {
		/*
		 * The purpose of the mutex_can_spin_on_owner() function is
		 * to eliminate the overhead of osq_lock() and osq_unlock()
		 * in case spinning isn't possible. As a waiter-spinner
		 * is not going to take OSQ lock anyway, there is no need
		 * to call mutex_can_spin_on_owner().
		 */
		// 这个函数中包含一些基本判断. 包括是否需要调度, 所有者是否在 CPU;
		// 所有者是否被抢占... 
		if (!mutex_can_spin_on_owner(lock))
			goto fail;

		/*
		 * In order to avoid a stampede of mutex spinners trying to
		 * acquire the mutex all at once, the spinners need to take a
		 * MCS (queued) lock first before spinning on the owner field.
		 */
		// 这里就是之前所说的锁了.
		if (!osq_lock(&lock->osq))
			goto fail;
	}

	for (;;) {
		struct task_struct *owner;

		/* Try to acquire the mutex... */
		owner = __mutex_trylock_or_owner(lock);
		if (!owner)
			break;

		/*
		 * There's an owner, wait for it to either
		 * release the lock or go to sleep.
		 */
		if (!mutex_spin_on_owner(lock, owner, ww_ctx, waiter))
			goto fail_unlock;

		/*
		 * The cpu_relax() call is a compiler barrier which forces
		 * everything in this loop to be re-loaded. We don't need
		 * memory barriers as we'll eventually observe the right
		 * values at the cost of a few extra spins.
		 */
		cpu_relax();
	}

	if (!waiter)
		osq_unlock(&lock->osq);

	return true;

fail_unlock:
	if (!waiter)
		osq_unlock(&lock->osq);

fail:
	/*
	 * If we fell out of the spin path because of need_resched(),
	 * reschedule now, before we try-lock the mutex. This avoids getting
	 * scheduled out right after we obtained the mutex.
	 */
	if (need_resched()) {
		/*
		 * We _should_ have TASK_RUNNING here, but just in case
		 * we do not, make it so, otherwise we might get stuck.
		 */
		__set_current_state(TASK_RUNNING);
		schedule_preempt_disabled();
	}

	return false;
}
```
