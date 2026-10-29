---
title: "fork and vfork"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/322f977829f045b0b4bc0b51bb5e1734"
---

[https://lwn.net/Articles/849638/](https://lwn.net/Articles/849638/)

在这篇文档里面偶然看到了 fork 是 COW 的. 然后就去了解了一下 fork 和 vfork 的区别.

发现之前的认知和实际有一定差距. 还好去了解了...

简单的对比:

[https://www.geeksforgeeks.org/difference-between-fork-and-vfork/](https://www.geeksforgeeks.org/difference-between-fork-and-vfork/)

简单的对比.

用我自己的话总结就是: 形式上 vfork 和 fork 同样底层都是调用 clone. 其区别仅在于 vfork 会多传递一个参数给 clone(后面说). fork 其内存为 COW. 而 vfrok 为共享(但是 children 不能改变源自 parent 的变量. 行为未定义.). fork 后 children 和 parent 的顺序未定义. 但是 vfork 会等待子进程结束. 

Copy on write is a standard mechanism for sharing a single instance of an object between processes in a situation where each process has the illusion of an independent, private copy of that object. Examples include memory pages shared between processes or data extents shared between files. To see how COW is used in the memory-management subsystem, consider what happens when a process calls fork(): the pages in that process's private memory areas should no longer be shared between the parent and child. But, instead of creating new copies of those pages for the child process during the fork() call, the kernel will simply map the parent's pages in the child's page tables. Importantly, the page-table entries in both parent and child are set as read-only (write-protected).

写时拷贝时一种标准的进程间共享同一个实例的机制. 每隔进程拥有一份独立的, 私有拷贝. 比如进程间的内存共享, 文件间的数据区共享. 考虑当进程 fork 时会发生什么: 在进程的私有区域依旧独立, 但是内核会简单地将 parent 的内存映射到 child 的页表中, 而不是为 child 拷贝一份. 重要的是, 页表入口在 parent 和 child 中被设置为只读(写保护).

If either process attempts to write to one of these pages, a page fault will occur, and the kernel's page-fault handler will create a new copy of the page, replacing the page-table entry (PTE) in the faulting process with a PTE that references the new page, but which allows the write to proceed. This action is often referred to as "breaking COW". If the other process then tries to write to that same page, another page fault will occur, as that process's PTE is still marked read-only. But now the page-fault handler will recognize that the page is no longer shared, so the PTE can just be made writable and the process can resume.

如果任一程序(parent or child)尝试对这些内存执行写操作. 将会导致页错误, 内核的页错误管理器将会创建一份新的拷贝, 重定向发生错误的 PTE 对应的页入口, 允许写操作继续执行. 如果其他程序尝试对同样的内存执行操作, 另一个页错误将会发生, 不过页错误管理器将会意识到页不再共享(猜测一下, 这里肯定是有一个类似引用计数的存在), 只是简单地将页设置为可写. 并继续.

所以, 就来看看到底会在哪里发生, 哪里处理. 

linux 代码版本 5.10-rc3.

kenel/fork.c

```cpp
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

#ifdef __ARCH_WANT_SYS_VFORK
SYSCALL_DEFINE0(vfork)
{
	struct kernel_clone_args args = {
		.flags		= CLONE_VFORK | CLONE_VM,
		.exit_signal	= SIGCHLD,
	};

	return kernel_clone(&args);
}
#endif
```

从以上代码可以看出, vfork 相对于 fork 而言, 调用时仅仅会多一个参数. 这里的 kernel_clone() 函数也会被 clone() 调用, 可以说是进程/线程创建的核心.

首先要解决的是: 为什么 vfork 共享, 而 fork 不共享. 然后我找到了 copy_mm 函数.

该函数会在 clone 调用 copy_process 时调用. 其附加还有其他拷贝资源函数, 如 file. namespace. io...

```cpp
static int copy_mm(unsigned long clone_flags, struct task_struct *tsk)
{
	struct mm_struct *mm, *oldmm;
	int retval;

	tsk->min_flt = tsk->maj_flt = 0;
	tsk->nvcsw = tsk->nivcsw = 0;
#ifdef CONFIG_DETECT_HUNG_TASK
	tsk->last_switch_count = tsk->nvcsw + tsk->nivcsw;
	tsk->last_switch_time = 0;
#endif

	tsk->mm = NULL;
	tsk->active_mm = NULL;

	/*
	 * Are we cloning a kernel thread?
	 *
	 * We need to steal a active VM for that..
	 */
	oldmm = current->mm;
	if (!oldmm)
		return 0;

	/* initialize the new vmacache entries */
	vmacache_flush(tsk);

	if (clone_flags & CLONE_VM) {
		mmget(oldmm);
		mm = oldmm;
		goto good_mm;
	}

	retval = -ENOMEM;
	mm = dup_mm(tsk, current->mm);
	if (!mm)
		goto fail_nomem;

good_mm:
	tsk->mm = mm;
	tsk->active_mm = mm;
	return 0;

fail_nomem:
	return retval;
}
```

实际 vfork 的核心拷贝就在于此:

```cpp
	if (clone_flags & CLONE_VM) {
		mmget(oldmm);
		mm = oldmm;
		goto good_mm;
	}
```

其中 mmget:

```cpp
static inline void mmget(struct mm_struct *mm)
{
	atomic_inc(&mm->mm_users);
}
```

如果是 vfork. 其将会增加 mm 的引用计数. 拷贝当前的 mm_struct 指针. 

而如果是 fork:

```cpp
mm = dup_mm(tsk, current->mm);
```

```cpp
static struct mm_struct *dup_mm(struct task_struct *tsk,
				struct mm_struct *oldmm)
{
	struct mm_struct *mm;
	int err;

	mm = allocate_mm();
	if (!mm)
		goto fail_nomem;

	memcpy(mm, oldmm, sizeof(*mm));

	if (!mm_init(mm, tsk, mm->user_ns))
		goto fail_nomem;

	err = dup_mmap(mm, oldmm);
	if (err)
		goto free_pt;

	mm->hiwater_rss = get_mm_rss(mm);
	mm->hiwater_vm = mm->total_vm;

	if (mm->binfmt && !try_module_get(mm->binfmt->module))
		goto free_pt;

	return mm;

free_pt:
	/* don't put binfmt in mmput, we haven't got module yet */
	mm->binfmt = NULL;
	mm_init_owner(mm, NULL);
	mmput(mm);

fail_nomem:
	return NULL;
}
```

fork 会拷贝一份 mm_struct 并初始化. 而并非仅拷贝指针. 

(唔... 这么简单, 稍微有点无趣啊...)

其次要解决的是: 为什么 vfork 为等待 child 执行结束.

这个问题的代码原因很好找, 再最上层 kernel_clone 就能找到:

```cpp
if (clone_flags & CLONE_VFORK) {
		if (!wait_for_vfork_done(p, &vfork))
			ptrace_event_pid(PTRACE_EVENT_VFORK_DONE, pid);
	}
```

还有一个很疑惑的问题. 如果 vfork 是共享的, 那么为什么 vfork child 修改 parent 的行为未定义?

---

简单理解明白了. 然后深入一些.

1. 为什么要这么做?
2. 这些函数具体如何工作的?

关于问题一. 我没有找到确切的答案, 不过可以从代码的行为看出来. parent 和 child 分享同一个 mm_struct. 那可能就存在竞态. 而要处理这些问题会让代码复杂度增加. 所以就让其中一个先执行. 而 child 没道理等待 parent 执行完才执行. 于是就让 parent 等待 child 执行完成.

然后就是第二个问题. 函数具体如何工作的. 比如. vfork 具体是如让 parent 等待的.
