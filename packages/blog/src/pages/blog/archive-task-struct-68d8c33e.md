---
title: "task_struct"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/68d8c33ec57943e99352a152e075c8f6"
---

task_struct 是 linux 进程/线程的基础结构. 重要性不言而喻.

这是一个有 700 多行的结构体(即使去除部分因环境而异的数据, 注释, 空行. 也依旧大概具有 100 来行的规格. 如果扩展其内部结构体的话, 可能还会更多)

我会先列一份去掉部分因环境(define)而无效的字段(用 * 标记). 在最后会给出一份完整的.

version 5.10-rc3

想了想. 这次不用代码段. 然后注释的方式来做笔记. 每个字段单独列出来. 这样后续有更深理解时也比较好扩展. (一些字段大概率需要等到对应的系统调用过程看完后才能明白它的用处)

### struct thread_info	thread_info; *

```c
/*
 * For reasons of header soup (see current_thread_info()), this
 * must be the first element of task_struct.
 */

// 这是一个因 cpu 而异的十分复杂的数据结构. 这里就以 x86 架构为准
struct thread_info {
	unsigned long		flags;		/* low level flags */
	u32			status;		/* thread synchronous flags */
};

/*
 * thread information flags
 * - these are process state flags that various assembly files
 *   may need to access
 */
#define TIF_SYSCALL_TRACE	0	/* syscall trace active */
#define TIF_NOTIFY_RESUME	1	/* callback before returning to user */
#define TIF_SIGPENDING		2	/* signal pending */
#define TIF_NEED_RESCHED	3	/* rescheduling necessary */
#define TIF_SINGLESTEP		4	/* reenable singlestep on user return*/
#define TIF_SSBD		5	/* Speculative store bypass disable */
#define TIF_SYSCALL_EMU		6	/* syscall emulation active */
#define TIF_SYSCALL_AUDIT	7	/* syscall auditing active */
#define TIF_SECCOMP		8	/* secure computing */
#define TIF_SPEC_IB		9	/* Indirect branch speculation mitigation */
#define TIF_SPEC_FORCE_UPDATE	10	/* Force speculation MSR update in context switch */
#define TIF_USER_RETURN_NOTIFY	11	/* notify kernel of userspace return */
#define TIF_UPROBE		12	/* breakpointed or singlestepping */
#define TIF_PATCH_PENDING	13	/* pending live patching update */
#define TIF_NEED_FPU_LOAD	14	/* load FPU on return to userspace */
#define TIF_NOCPUID		15	/* CPUID is not accessible in userland */
#define TIF_NOTSC		16	/* TSC is not accessible in userland */
#define TIF_IA32		17	/* IA32 compatibility process */
#define TIF_SLD			18	/* Restore split lock detection on context switch */
#define TIF_MEMDIE		20	/* is terminating due to OOM killer */
#define TIF_POLLING_NRFLAG	21	/* idle is polling for TIF_NEED_RESCHED */
#define TIF_IO_BITMAP		22	/* uses I/O bitmap */
#define TIF_FORCED_TF		24	/* true if TF in eflags artificially */
#define TIF_BLOCKSTEP		25	/* set when we want DEBUGCTLMSR_BTF */
#define TIF_LAZY_MMU_UPDATES	27	/* task is updating the mmu lazily */
#define TIF_SYSCALL_TRACEPOINT	28	/* syscall tracepoint instrumentation */
#define TIF_ADDR32		29	/* 32-bit address space on 64 bits */
	#define TIF_X32			30	/* 32-bit native x86-64 binary */
```

<aside>
☸️

</aside>

### volatile long	state;

```c
/* -1 unrunnable, 0 runnable, >0 stopped: */

/*
 * Task state bitmask. NOTE! These bits are also
 * encoded in fs/proc/array.c: get_task_state().
 *
 * We have two separate sets of flags: task->state
 * is about runnability, while task->exit_state are
 * about the task exiting. Confusing, but this way
 * modifying one set can't modify the other one by
 * mistake.
 */
/* Used in tsk->state: */
#define TASK_RUNNING	0x0000
#define TASK_INTERRUPTIBLE	0x0001
#define TASK_UNINTERRUPTIBLE	0x0002
#define __TASK_STOPPED	0x0004
#define __TASK_TRACED	0x000
```

### void	*stack;

栈指针
