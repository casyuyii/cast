---
title: "Seqcount lock"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/b17a55fb7a054d11a7fbf38f4a3925ee"
---

emm... 久违地更新了!

今天想要写的是 seqcount lock.

[https://lwn.net/Articles/831540/](https://lwn.net/Articles/831540/)

The kernel contains a wide variety of locking primitives; it can be hard to stay on top of all of them. So even veteran kernel developers might be forgiven for being unaware of the "seqcount latch" lock type or its use. While this lock type has existed in the kernel for several years, it is only being formalized with a proper type declaration in 5.10. So this seems like a good time to look at what these locks are and how they work.

内核包含了大量的锁技术. 很难掌握所有. 所以即使是老练的内核开发者, 也有可能不知道 "seqcount latch" 锁类型或者它的使用(所以, 今天! 在下知道了! 😎) 

这个所类型在内核中已存在数年. 只在 5.10 版本被正式声明为一个适当的类型. 所以, 看起来是一个合适的时间去了解其技术细节. 

Seqcounts (and seqlocks, which are built on top of seqcounts) are among the many primitives used to reduce locking overhead in specific situations; their use is most indicated when reads to protected data far outnumber writes, and updates to the data are quick when they do happen. Rather than preventing concurrent access to data, seqcounts and seqlocks work by detecting when a reader and a writer collide and forcing readers to retry in such situations. They were first [introduced for the 2.5.60 development kernel](https://lwn.net/Articles/22818/) in 2003, and have grown considerably in complexity since then.

Seqcounts(以及基于其实现的 seqlocks). 在众多'基元'中用于在特定的场合减少锁的消耗. 它最常被用于读取被保护数据次数远高于写次数(高读取, 低写入), 并且更新速度快的情景. 而并非阻止并发访问数据. seqcounts 和 seqlocks 通过确定 reader 和 writer 是否冲突, 然后强制 reader 重新尝试. 它们首次在 2003 年的 2.5.60 开发内核中被引入. 并在那时起就开始变得困难. 

Seqcounts are the lowest-level piece of this mechanism; at their core, they are a simple counter that is incremented whenever the protected data is modified. Indeed, the counter is incremented twice, once before the process of modifying the data begins with a call to:

Seqcount 是这些技术中最底层的部分. 在其核心, 它只是一个简单的计数器, 随着被保护数据变化而自增. 实际上, 这些计数器自增两次. 一次在处理这些改变数据之前:

```c
static inline void raw_write_seqcount_t_begin(seqcount_t *s)
{
	s->sequence++;
	smp_wmb();
}
```

and once after modification is complete by calling:

一次是在更新完成之后.

```c
static inline void raw_write_seqcount_t_end(seqcount_t *s)
{
	smp_wmb();
	s->sequence++;
}
```

(Some debugging instrumentation has been removed from the above). As can be seen, write-side seqcount operations come down to incrementing the counter, plus some carefully placed write barriers (the calls to smp_wmb()) to ensure the correct ordering between changes to the counter and to the protected data. One key point to note here is that the counter, which starts at zero, will be odd while modification is taking place, and even otherwise.

write-side Seqcount 操作总结为增加计数器, 加上一些谨慎的 palced write-barriers 以确保更新计数器和被保护内存间的顺序. 这里值得注意的是计数器, 从 0 开始, 在写入期间将会是奇数. 其余情况将会是偶数(所以实际用奇偶树来区分两种情况, 它将写入分为了两步, 奇数被视为不合理. 所以这里没有了锁, reader/write 没有获取任何资源. writer 不会等待 reader. 相反 reader 需要等待 writer. 同时, reader 读取的可能是一份拷贝. 又或许这可以和 RCU 结合使用.)

Before a reader can access the protected data, it must enter the critical section with a call to:

在 reader 可以范围被保护数据签, 必须先进入临界区.

```c
static inline unsigned __read_seqcount_t_begin(const seqcount_t *s)
{
	unsigned ret;

	repeat:
	ret = READ_ONCE(s->sequence);
	if (unlikely(ret & 1)) {
		cpu_relax();
		goto repeat;
	}
	return ret;
}
```

(Again, debugging code has been removed; note also that real users will call higher-level functions built on the above). This function starts by checking whether modification is currently taking place (as indicated by the sequence counter having an odd value); if so, it will spin until the sequence count is incremented again (the cpu_relax() call serves a few functions, including inserting a compiler barrier and potentially letting an SMT sibling run). Then the current counter value is returned and the caller can provisionally read the protected data. Once that has been done, the section is exited with a call to:

函数检查更改是否发生(由包含奇数的序列计数器表示). 如果是奇数, 将会循环直到再次自增. 然后, 当前计数器值返回, 调用者可以临时读取被保护值. 当这个过程结束时, 阶段退出.

```c
static inline int __read_seqcount_t_retry(const seqcount_t *s, unsigned start)
{
	return unlikely(READ_ONCE(s->sequence) != start);
}
```

The return value from this function tells the caller whether modification of the data has occurred while it was being read; if __read_seqcount_t_retry() returns true, the caller must go back to the beginning and try again. For this reason, accesses to seqcount-protected data is normally coded as a do..while loop that repeats until the data has been successfully read.

函数返回值告知调用者在其读取期间数据是否发生了改变. 如果函数返回 true. 调用者必须再次尝试. 在这种情况下, 代码通常是一个 do while 循环.

Upon this simple foundation has been built a whole array of variants for specific use cases. Many callers in the kernel use the higher-level seqlock_t type, which handles details like concurrency among writers among other things. See [include/linux/seqlock.h](https://elixir.bootlin.com/linux/v5.9-rc4/source/include/linux/seqlock.h) for lots of details.

在这个简单的基础之上已经派生出一系列用于指定用途的变体. 大量用户在内核中使用高级 seqlock_t 类型的锁. 就像在写者中并发一样在其他事情上处理细节. (不是很能明白这段话的意思) 

While the above interface works in most situations, there is one important case where things fall apart: if a reader ever preempts a writer on the same CPU. For example, if a writer is preempted by an interrupt handler, and that handler attempts to enter a read section for the same data, the CPU will deadlock while the reader spins waiting for an update that will never complete. This situation is normally avoided by disabling preemption and interrupts while the write is taking place; that is one of the many things handled by the higher-level seqlock interfaces.

上述代码在大多数时候都正常运行. 但是有一个需要注意的场景: 如果 reader 在同一 CPU 上抢占了 writer. 比如: writer 被中断抢占. 同时中断控制中尝试进入同样的 reader 区域. 就会死锁. 这种场景通常在 writer 工作时取消竞态和中断避免. 这些是上层锁所控制的范围之一.

There are times, though, when it is not possible to completely block interrupts; in particular, code that might be called within a non-maskable interrupt is, as the name suggests, not maskable. Blocking preemption and interrupts also tends to be unwelcome in realtime kernels; another solution must be found for those cases. One such solution, [introduced](https://git.kernel.org/linus/9b0fd802e8c0) by Mathieu Desnoyers in 2014, is the seqcount latch. It avoids the possibility of an infinite spin at the cost of maintaining two copies of the protected data.

In particular, if a structure of type struct mydata is to be protected with a seqcount latch, that structure will need to be declared as:

```cpp
struct mydata data[2];
```

At any given time, one entry in that array will be considered live and available, while the other is reserved for modifications by a writer. The least-significant bit in the sequence counter indicates which element should be read at any given time. Code for the read side now looks something like this:

```cpp
do {
  seq = raw_read_seqcount_latch(&seqcount);
	index = seq & 0x01;
	do_something_with(data[index]);
} while (read_seqcount_retry(&seqcount, seq));
```

There is still a loop here, which detects concurrent modification of the data. But if a writer has been interrupted by a reader, the count will not change and there will be no need to retry the access.

To update the protected data, the writer simply makes any modifications to the entry in the data array that is not currently being used by the readers. Nobody should be looking at that entry, so there should be no need for any particular protection (unless concurrent writers are a possibility, of course). When the new data is ready, the writer calls:

```cpp
static inline void raw_write_seqcount_t_latch(seqcount_t *s)
{
   smp_wmb();      /* prior stores before incrementing "sequence" */
   s->sequence++;
   smp_wmb();      /* increment "sequence" before following stores */
}
```

After this call, readers will be directed to the new version of the data. For an example of how seqcount latches are used, see the handling of timekeeping data ([read side](https://elixir.bootlin.com/linux/v5.9-rc5/source/kernel/time/sched_clock.c#L71) and [write side](https://elixir.bootlin.com/linux/v5.9-rc5/source/kernel/time/sched_clock.c#L99)) in kernel/time/sched_clock.c.

The 5.10 kernel will see the merging of [a patch series](https://lwn.net/ml/linux-kernel/20200827114044.11173-1-a.darwish@linutronix.de/) from Ahmed Darwish that formalizes the seqcount latch API. Since it was first introduced, the seqcount latch has been implemented as a sort of "off-label" use of the seqcount type, changing its semantics in ways that, one hopes, all users understand. Darwish, instead, has concluded that the seqcount latch is a separate type of lock that should be handled independently of seqcounts.

Thus, his patch set introduces a new seqcount_latch_t type and changes the prototypes of the relevant functions to expect parameters of that type. That helps to nail down the actual semantics of the seqcount latch and ensures that callers won't mix locks of that type up with ordinary seqcounts. The interface still lives in <linux/seqlock.h>, but it could logically be moved elsewhere at this point.

None of this is likely to make the use of seqcount latch locks more popular; the situations where they are needed are rare indeed. There are only four users in the 5.9 kernel, and one of those is removed in Darwish's patch set as an "abuse" of the type (though, if one counts users of the [latch tree type](https://elixir.bootlin.com/linux/v5.9-rc4/source/include/linux/rbtree_latch.h), the number goes up slightly). If a kernel developer is wondering if a seqcount latch is needed in a given situation, the answer is almost certainly "no". But it is illustrative of the lengths to which kernel developers must go in order to provide safe-but-fast access to critical system data in all situations.

后面大概意思是, 出于一些情况. 信号不能被中断. 一种解决这个问题的办法是维护两份数据. 分别用于 read 和 write. (我懒癌犯了, 就不赘述了)
