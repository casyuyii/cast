---
title: "Memory Synchronization"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/e65ebdaebac543bb9751a7f89b7b9f12"
---

继续看一下 glibc 的代码. 继续内存同步这一块. 实际是 pthreads 相关函数.

PS: 好像很多实现都在 hurd 里面. 

<!--more -->

## fork

先认识一些基础的数据结构.

```c
struct hurd_sigstate
  {
    spin_lock_t critical_section_lock; /* Held if in critical section.  */

    spin_lock_t lock;		/* Locks most of the rest of the structure.  */

    thread_t thread; // 线程ID
    struct hurd_sigstate *next; /* Linked-list of thread sigstates.  */

		// sigset_t 是一个由 unsigned long int 组成的数组 
		// 其最大长度为: 1024 / 8 * sizeof (unsigned long int)
    sigset_t blocked;		/* What signals are blocked.  */
    sigset_t pending;		/* Pending signals, possibly blocked.  */

    /* Signal handlers.  ACTIONS[0] is used to mark the threads with POSIX
       semantics: if sa_handler is SIG_IGN instead of SIG_DFL, this thread
       will receive global signals and use the process-wide action vector
       instead of this one.  */
    struct sigaction actions[_NSIG];

    stack_t sigaltstack;

    /* Chain of thread-local signal preemptors; see <hurd/sigpreempt.h>.
       Each element of this chain is in local stack storage, and the chain
       parallels the stack: the head of this chain is in the innermost
       stack frame, and each next element in an outermore frame.  */
    struct hurd_signal_preemptor *preemptors;

    /* For each signal that may be pending, the details to deliver it with.  */
    struct hurd_signal_detail pending_data[_NSIG];

    /* If `suspended' is set when this thread gets a signal,
       the signal thread sends an empty message to it.  */
    mach_port_t suspended;

    /* The following members are not locked.  They are used only by this
       thread, or by the signal thread with this thread suspended.  */

    volatile mach_port_t intr_port; /* Port interruptible RPC was sent on.  */

    /* If this is not null, the thread is in sigreturn awaiting delivery of
       pending signals.  This context (the machine-dependent portions only)
       will be passed to sigreturn after running the handler for a pending
       signal, instead of examining the thread state.  */
    struct sigcontext *context;

    /* This is the head of the thread's list of active resources; see
       <hurd/userlink.h> for details.  This member is only used by the
       thread itself, and always inside a critical section.  */
    struct hurd_userlink *active_resources;

    /* These are locked normally.  */
    int cancel;			/* Flag set by hurd_thread_cancel.  */
    void (*cancel_hook) (void);	/* Called on cancellation.  */
  };

/* Linked list of states of all threads whose state has been asked for.  */
```

emm... 看不懂... Orz 

姑且先理解为: 信号相关配置.

这代码量. 不愧是 fork 呢... 

我看不懂! 差了太多必要的东西了. 我裂开了... 不! cas 你行的.

![cas 你可以的!](/archive-assets/896951db2eded380.jpg)

cas 你可以的!

那么, 一点一点来分析. (因为神秘缘故上面代码没有语法高亮(已经删除了). 所以这也拆开也比较好!)

```c
/* Clone the calling process, creating an exact copy.
   Return -1 for errors, 0 to the new process,
   and the process ID of the new process to the old process.  */
pid_t
__fork (void)
{
	jmp_buf env; // jmp_buf 是个后续会用到的值
	pid_t pid; // 很显然就是子进程 ID 了
  size_t i;
  error_t err;
  struct hurd_sigstate *volatile ss;

	
// 	2013-10-04  Samuel Thibault  <samuel.thibault@ens-lyon.org>
// 	
// 		* sysdeps/mach/hurd/fork.c (_hurd_atfork_prepare_hook)
// 		(_hurd_atfork_child_hook, _hurd_atfork_parent_hook): New hooks.
// 		(__fork): Call _hurd_atfork_prepare_hook hooks before all locking, call
// 		_hurd_atfork_parent_hook or _hurd_atfork_child_hook after all unlocking.
	// 关于这个, 我找到了上述日志. (可惜是 13 年的, 不然想去打扰一下作者)
	// 看起来是在 fork 时的准备工作.
	RUN_HOOK (_hurd_atfork_prepare_hook, ())

  ss = _hurd_self_sigstate ();
  __spin_lock (&ss->critical_section_lock);

#undef	LOSE
#define LOSE do { assert_perror (err); goto lose; } while (0) /* XXX */
```

```c
// 关于 _hurd_atfork_prepare_hook :
struct atfork
{
  void (*prepare) (void);
  void (*parent) (void);
  void (*child) (void);
  void *dso_handle;
  struct atfork *prev;
  struct atfork *next;
};

/* TODO: better locking */
__libc_lock_define_initialized (static, atfork_lock);
static struct atfork *fork_handlers, *fork_last_handler;

// 这个函数的意图挺好理解的, 循环遍历. 执行准备工作.
// 不过问题是, 这些工作是从哪里设置的 = =
// fork_handles 和 fork_last_handler 看起来应该是有一段'距离'的, 这又是哪里设置的呢 = =
static void
atfork_pthread_prepare (void)
{
  struct atfork *handlers, *last_handler;

  __libc_lock_lock (atfork_lock);
  handlers = fork_handlers;
  last_handler = fork_last_handler;
  __libc_lock_unlock (atfork_lock);

  if (last_handler == NULL)
    return;

  while (1)
    {
      if (last_handler->prepare != NULL)
	last_handler->prepare ();
      if (last_handler == handlers)
	break;
      last_handler = last_handler->prev;
    }
}
text_set_element (_hurd_atfork_prepare_hook, atfork_pthread_prepare);
```

```c
// 关于setjmp: [link](https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.1.0/com.ibm.zos.v2r1.bpxbd00/setjmp.htm) 
// 简而言之, 它会保存当前环境, 而之后在 longjmp 则会返回到当前环境. 
// 而此时, setjmp 返回非 0. 类似于一个开关.
if (! setjmp (env))
    {
			// 这部分看起来是在准备变量
      process_t newproc;
      task_t newtask;
      thread_t thread, sigthread;
      mach_port_urefs_t thread_refs, sigthread_refs;
      struct machine_thread_state state;
      mach_msg_type_number_t statecount;
      mach_port_t *portnames = NULL;
      mach_msg_type_number_t nportnames = 0;
      mach_port_type_t *porttypes = NULL;
      mach_msg_type_number_t nporttypes = 0;
      thread_t *threads = NULL;
      mach_msg_type_number_t nthreads = 0;
      int ports_locked = 0, stopped = 0;
```

```c
// 这里是我极其疑惑的一点. 这不是函数定义么?
// 函数中函数定义? 不可以这么做啊... Orz
		void resume_threads (void)
	{
	  if (! stopped)
	    return;

	  assert (threads);

	  for (i = 0; i < nthreads; ++i)
	    if (threads[i] != ss->thread)
	      __thread_resume (threads[i]);
	  stopped = 0;
	}
```

```c
/* Run things that prepare for forking before we create the task.  */
      RUN_HOOK (_hurd_fork_prepare_hook, ());

      /* Lock things that want to be locked before we fork.  */
      {
	void *const *p;
	for (p = symbol_set_first_element (_hurd_fork_locks);
	     ! symbol_set_end_p (_hurd_fork_locks, p);
	     ++p)
	  __mutex_lock (*p);
      }
      __mutex_lock (&_hurd_siglock);
```

```c
// 关于 _hurd_fork_prepare_hook (看起来就是加锁) : 
/* Before fork, lock the interlock so that we are in a clean state. */
static void
fork_profil_prepare (void)
{
  __spin_lock (&lock);
}
text_set_element (_hurd_fork_prepare_hook, fork_profil_prepare)
```

```c
// 这块代码之前有说过, 获取 malloc 内部的所有锁.(即: 锁 malloc)
/* Acquire malloc locks.  This needs to come last because fork
	 handlers may use malloc, and the libio list lock has an
	 indirect malloc dependency as well (via the getdelim
	 function).  */
      call_function_static_weak (__malloc_fork_lock_parent);
      _hurd_malloc_fork_prepare ();

      newtask = MACH_PORT_NULL;
      thread = sigthread = MACH_PORT_NULL;
      newproc = MACH_PORT_NULL;
```

```c
/* Lock all the port cells for the standard ports while we copy the
	 address space.  We want to insert all the send rights into the
	 child with the same names.  */
      for (i = 0; i < _hurd_nports; ++i)
	__spin_lock (&_hurd_ports[i].lock);
      ports_locked = 1;
```

```c
/* Keep our SS locked while stopping other threads, so they don't get a
         chance to have it locked in the copied space.  */
      __spin_lock (&ss->lock);
      /* Stop all other threads while copying the address space,
	 so nothing changes.  */
	// 通过这些注释可知, fork 会阻塞所有线程?
      err = __proc_dostop (_hurd_ports[INIT_PORT_PROC].port, ss->thread);
      __spin_unlock (&ss->lock);
      if (!err)
	{
	  stopped = 1;

#define XXX_KERNEL_PAGE_FAULT_BUG /* XXX work around page fault bug in mk */

#ifdef XXX_KERNEL_PAGE_FAULT_BUG
	  /* Gag me with a pitchfork. // 这句话直译过来是 "用干草叉把我吐出来" ... 我 ...
																// 网上查了一下, 大概是吃惊的意思. 我没具体明白他说的 bug...
	     The bug scenario is this:

	     - The page containing __mach_task_self_ is paged out.
	     - The signal thread was faulting on that page when we
	       suspended it via proc_dostop.  It holds some lock, or set
	       some busy bit, or somesuch.
	     - Now this thread faults on that same page.
	     - GRATUIOUS DEADLOCK

	     We can break the deadlock by aborting the thread that faulted
	     first, which if the bug happened was the signal thread because
	     it is the only other thread and we just suspended it.
	     */
	  __thread_abort (_hurd_msgport_thread);
#endif
	  /* Create the child task.  It will inherit a copy of our memory.  */
	  err = __task_create (__mach_task_self (), // @note 这里是具体的创建
#ifdef KERN_INVALID_LEDGER
			       NULL, 0,	/* OSF Mach */
#endif
			       1, &newtask);
	}
```

```c
/* Unlock the global signal state lock, so we do not
	 block the signal thread any longer than necessary.  */
      __mutex_unlock (&_hurd_siglock);

      if (err)
	LOSE;

      /* Fetch the names of all ports used in this task.  */ // 所以说, 他所说的 prot 是什么?
      if (err = __mach_port_names (__mach_task_self (),
				   &portnames, &nportnames,
				   &porttypes, &nporttypes))
	LOSE;
      if (nportnames != nporttypes)
	{
	  err = EGRATUITOUS;
	  LOSE;
	}
```

关于上面我一直很在意的 port. 我找到了 [解释](https://docs.darlinghq.org/internals/macos-specifics/mach-ports.html) 

emm... 我好像有了很大的发现 (学习的途中总是伴随着意外...)

我之前看到了很多形如: mach_... 我以为这是指 machine 的意思. 但现在看来, 它就是 mach. 这可有点复杂了. 就我才从 [wiki](https://en.wikipedia.org/wiki/Mach_(kernel)) 中的描述看来. 这好像是一种内核, 一种新概念 (wiki万岁, 不愧我赞助过它) :

> One of the first systems to use a pipe-like system as the basis for the operating system was the Aleph kernel developed at the University of Rochester. This introduced the concept of ports. <u>which were essentially a shared memory implementation.</u>
In Aleph, <u>the kernel itself was reduced to providing access to the hardware, including memory and the ports, while conventional programs using the ports system implemented all behavior, from device drivers to user programs. This concept greatly reduced the size of the kernel</u>, and allowed users to experiment with different drivers simply by loading them and connecting them together at runtime. This greatly eased the problems when developing new operating system code, which otherwise generally required the machine to be restarted. <u>The general concept of a small kernel and external drivers became known as a microkernel.</u>
> 

在此中途, 我又去看了看 fork 的 [历史](https://ieeexplore.ieee.org/document/7548985) (我从一位 blog 作者那里学来的, 历史很重要! (历史老师露出了欣慰的笑容😃) )

简单描述一下就是: 1962 年 conway 有了 fork 这个概念. 这个概念随后被应用于 project genie (一种时分系统中) 后续影响到了某些操作系统. 到现在 fork 已经是一个很重要的概念了.

emm... 回过头来... [GNU hurd](https://en.wikipedia.org/wiki/GNU_Hurd)

> GNU Hurd is the multiserver microkernel written as part of GNU. It has been under development since 1990 by the GNU Project of the Free Software Foundation, <u>designed as a replacement for the Unix kernel</u>, and released as free software under the GNU General Public License. When the Linux kernel proved to be a viable solution, development of GNU Hurd slowed, at times having slipped intermittently between stasis and renewed activity and interest.
> 

怪不得可以看到很多应该是系统调用的实现. 结合 mach 的含义. GNU hurd 应该是一种替代. 而 mach 是一种微内核. 突然感到自己是个憨批... 我裂开了...

不过还好, 还算没有看错, 我也很喜欢这种精简的东西. (强行解释) 

PS: 顺便去 linux kernel 看了下, fork 的实现是 syscall. 综上所述, 我先去看看 linux 的实现~.

代码的缩进很好, 比 glibc 好很多. 很高兴 😀

```jsx
#ifdef __ARCH_WANT_SYS_FORK
SYSCALL_DEFINE0(fork)
{
#ifdef CONFIG_MMU
	struct kernel_clone_args args = {
		.exit_signal = SIGCHLD,
	};

	return kernel_clone(&args);
#else
	/* can not support in nommu mode */
	return -EINVAL;
#endif
}
#endif
// 上面的 fork 代码在我的环境下部分是注释掉的. 会直接返回 -EINVAL. 

#ifdef __ARCH_WANT_SYS_VFORK
SYSCALL_DEFINE0(vfork)
{
	struct kernel_clone_args args = {
		.flags		= CLONE_VFORK | CLONE_VM,
		.exit_signal	= SIGCHLD,
	};

	// 一个简单的调用
	return kernel_clone(&args);
}
#endif

/* All the bits taken by the old clone syscall. */
#define CLONE_LEGACY_FLAGS 0xffffffffULL

struct kernel_clone_args {
	u64 flags;
	int __user *pidfd; // file descriptor
	int __user *child_tid; // tid = task id ?
	int __user *parent_tid;
	int exit_signal; // 上面有参数传递
	unsigned long stack; // 栈顶指针
	unsigned long stack_size; // 栈大小
	unsigned long tls;
	pid_t *set_tid; // tid 集合?
	/* Number of elements in *set_tid */
	size_t set_tid_size;
	int cgroup;
	// 这又是两个很大的结构体了. cgroup 可以就理解为 control group
	// css 则代表 cgroup_subsystem_state
	struct cgroup *cgrp;
	struct css_set *cset;
};
```

```jsx
/*
 *  Ok, this is the main fork-routine.
 *
 * It copies the process, and if successful kick-starts
 * it and waits for it to finish using the VM if required.
 *
 * args->exit_signal is expected to be checked for sanity by the caller.
 */
pid_t kernel_clone(struct kernel_clone_args *args)
{
	u64 clone_flags = args->flags;
	struct completion vfork;
	struct pid *pid;
	struct task_struct *p;
	int trace = 0;
	pid_t nr;

	/*
	 * For legacy clone() calls, CLONE_PIDFD uses the parent_tid argument
	 * to return the pidfd. Hence, CLONE_PIDFD and CLONE_PARENT_SETTID are
	 * mutually exclusive. With clone3() CLONE_PIDFD has grown a separate
	 * field in struct clone_args and it still doesn't make sense to have
	 * them both point at the same memory location. Performing this check
	 * here has the advantage that we don't need to have a separate helper
	 * to check for legacy clone().
	 */
	if ((args->flags & CLONE_PIDFD) &&
	    (args->flags & CLONE_PARENT_SETTID) &&
	    (args->pidfd == args->parent_tid))
		return -EINVAL;

	/*
	 * Determine whether and which event to report to ptracer.  When
	 * called from kernel_thread or CLONE_UNTRACED is explicitly
	 * requested, no event is reported; otherwise, report if the event
	 * for the type of forking is enabled.
	 */
	if (!(clone_flags & CLONE_UNTRACED)) {
		if (clone_flags & CLONE_VFORK)
			trace = PTRACE_EVENT_VFORK;
		else if (args->exit_signal != SIGCHLD)
			trace = PTRACE_EVENT_CLONE;
		else
			trace = PTRACE_EVENT_FORK;

		if (likely(!ptrace_event_enabled(current, trace)))
			trace = 0;
	}

	p = copy_process(NULL, trace, NUMA_NO_NODE, args);
	add_latent_entropy();

	if (IS_ERR(p))
		return PTR_ERR(p);

	/*
	 * Do this prior waking up the new thread - the thread pointer
	 * might get invalid after that point, if the thread exits quickly.
	 */
	trace_sched_process_fork(current, p);

	pid = get_task_pid(p, PIDTYPE_PID);
	nr = pid_vnr(pid);

	if (clone_flags & CLONE_PARENT_SETTID)
		put_user(nr, args->parent_tid);

	if (clone_flags & CLONE_VFORK) {
		p->vfork_done = &vfork;
		init_completion(&vfork);
		get_task_struct(p);
	}

	wake_up_new_task(p);

	/* forking complete and child started to run, tell ptracer */
	if (unlikely(trace))
		ptrace_event_pid(trace, pid);

	if (clone_flags & CLONE_VFORK) {
		if (!wait_for_vfork_done(p, &vfork))
			ptrace_event_pid(PTRACE_EVENT_VFORK_DONE, pid);
	}

	put_pid(pid);
	return nr;
}
```

看看 task_struct 的结构. (约 700 行的结构体. 就算去掉注释和空行, 也有 100 来行. 日你大坝 ☹️)

PS: 累了, 枯了. 不想整理了. 整理好麻烦. = =. 看有时间填坑吧.

[https://images.app.goo.gl/7BE4ZkdGz5h9GbBu9](https://images.app.goo.gl/7BE4ZkdGz5h9GbBu9)
