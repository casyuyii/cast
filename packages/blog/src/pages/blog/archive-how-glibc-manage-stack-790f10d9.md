---
title: "How glibc manage stack"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/790f10d9496e4d71978e15166b8fe04a"
---

看一下 glibc 内存管理的实现. 主要是内存分配那块. malloc free…

实际代码有点绕. 这个人文档深度方面仅仅到达理解这些函数的实现. 并不包含其中某些代码不存在于 glibc 中如 vm_alloc 的实现理解(这方面需要一些硬件知识, 而且我尝试过后没找到对应代码 = =)

代码中对于类型的理解很深刻. 也是第一次看到这么令我感到一些吃惊的 union 使用. 感觉对 union 的理解更深了.

不由得感叹, 不愧是内核编写使用的语言. 看 C 代码能比其他封装过度的代码对相关技术和设计有更深的理解(尤其是内存).

比如这次之后. 我对 union 的看法可以总结为: 一块内存的多种解释.

PS: 突然意识到某些时候, 自己还是太肤浅了. 只能说出技术的表现. 而非原理. (明表现, 理实现. 重原理?)

代码选用截至 2020年10月24日 最新的 glibc-2.32 版本. 环境为 windows 10 vscode.

代码位于 hurdmalloc.c 文件. (其实关于 hurd 的命名还有维基. 有意向可以去看看)

为简洁起见, 我会注释一些因宏而失效的代码(这样的代码在其他环境下可能就是生效的)

<!--more-->

## malloc

```c
/* Declaration changed to standard one for GNU.  */
void *
malloc (size_t size)
{
	int i, n;
	free_list_t fl;
	header_t h;

	if ((int) size < 0)		/* sanity check */
		return 0;
    // 这个 HEADER_SIZE 为 header 的大小.
	size += HEADER_SIZE;
	/*
	 * Find smallest power-of-two block size
	 * big enough to hold requested size plus header.
	 */
	i = 0;
	n = MIN_SIZE;
	while (n < size) {
		i += 1;
		n <<= 1;
	}
    // NBUCKETS 为 29 
    // MIN_SIZE 为 16
    // n 总是 2 的 n 次方.
    // 4 + 28 = 32. 所以 malloc 最多能分配 2 的 32 次方大小的内存.
	ASSERT(i < NBUCKETS);
    // malloc_free_list 是 malloc 用户管理 heap 的元数据.
    // 其内部每个接口都对应 2 的 n 次方分配的内存块. 
    // 不同大小内存以 2 的 n 次方为条件. 组织在一起.
	fl = &malloc_free_list[i];
    // spin_lock 的实现为 asm volatile + automic command
    // 这里可以看出, 每个接口都有一把锁. 小的. 频繁分配释放的内存会是瓶颈
	spin_lock(&fl->lock);
	h = fl->head;
    // head 为每个入口的头部. 可以将其理解为链表的表头. 但又有稍许不同
    // 实现起来又像个 stack 😂. 稍后将明白它的结构.
	if (h == 0) {
		/*
		 * Free list is empty;
		 * allocate more blocks.
		 */
        // @note 表头为空. 需要分配内存
        // 这里可以假设, 内存被分配好了. fl->head 将指向分配好的内存.
		more_memory(n, fl);
		h = fl->head;
		if (h == 0) {
			/*
			 * Allocation failed.
			 */
			spin_unlock(&fl->lock);
			return 0;
		}
	}
	/*
	 * Pop block from free list.
	 */
    // Pop 这里可以得知. glibc 的实现者也觉得这东西像个 stack
    // HEADR_NEXT 将会返回 h->next
    // 结合上面代码来看. 就是将待返回的已分配好的内存从 'stack' 里面 pop.
	fl->head = HEADER_NEXT (h);

#ifdef MCHECK
    // CHECK_FREE 和 CHECK_BUSY 的数值很诡异
    // 我看不出有什么特意
	assert (HEADER_CHECK (h) == CHECK_FREE);
	HEADER_CHECK (h) = CHECK_BUSY;
#endif

	spin_unlock(&fl->lock);
	/*
	 * Store free list pointer in block header
	 * so we can figure out where it goes
	 * at free() time.
	 */
    // @note 这里也是很重要的一点. 我之前理解代码时. 忽略了这段代码
    // 	导致我绕了好几圈. 都未能理清楚.
    // HEADER_FREE 会返回内部指针. fl 就是之前取到的接口地址
	// 实际产生的效果是, 内部指针记录了接口的地址.
    // 这会使后续 fl->head 为空时, 再分配的内存可以和之前已分配的串连起来.
    HEADER_FREE (h) = fl;
	/*
	 * Return pointer past the block header.
	 */
    // 这里将 HEADER_SIZE 去除后返回
    // PS: 我记得某种实现. 返回的指针前会带有一个数值. 这个数值正好是分配内存的大小.
    //	是改了呢, 还是在其他敌方实现了呢?
	return ((char *) h) + HEADER_SIZE;
}
```

其中数据结构:

```c
typedef struct header {
  long check;
  union {
    struct header *next;
    struct free_list *fl;
  } u;
} *header_t;
    
typedef struct free_list {
	spin_lock_t lock;	/* spin lock for mutual exclusion */
	header_t head;		/* head of free list for this size */
} *free_list_t;
```

// 手有点累…

继续看看 malloc 中比较核心的 more_memory

```c
static void
more_memory(int size, free_list_t fl)
{
	int amount;
	int n;
	vm_address_t where;
	header_t h;
	kern_return_t r;

    // 如果待分配大小 <= vm_page_size ( 通常是 4096 )
    // 那么一次性分配至少 vm_page_size 大小的内存.
	if (size <= vm_page_size) {
		amount = vm_page_size;
        // 这里的 n 需要注意. 后续会用到
		n = vm_page_size / size;
		/* We lose vm_page_size - n*size bytes here.  */
	} else {
        // 如果超出 vm_page_size. 则以待分配内存大小为准
		amount = size;
		n = 1;
	}
	// PS: 我为了找 vm_page_size 的具体实现在哪里找了一大圈 = =
    // 最后发现又是一个 vm_* 的调用获取的. 其中具体获取的数值在 linux kernel 中
    // 很不甘心. 我还是不知道这个函数的调用细节.
    
    
    // 烦人的 vm_*. 迟早有一天会搞定你.
    // 这里就姑且这么理解: 分配了内存. 数量为 amount. 最后返回的地址存在 where
    // mach_task_self 又是一个很迷的东西. 包含了 tcb.
	r = vm_allocate(mach_task_self(), &where, (vm_size_t) amount, TRUE);
	assert_perror (r);

    // @note 
	h = (header_t) where;
	do {
        // 被分配内存中保存了当前接口头
		HEADER_NEXT (h) = fl->head;
#ifdef MCHECK
		HEADER_CHECK (h) = CHECK_FREE;
#endif
        // 当前接口头为改为被分配内存
		fl->head = h;
        // @note n 的作用在这里.
        // 当不到 vm_page_size 时. 分配的内存会是待分配内存的 n 倍.
        // 将这些内存关联起来. 以后再使用相同大小(以 2 的 n 次方为基准)时. 直接就可以使用了.
		h = (header_t) ((char *) h + size);
	} while (--n != 0);
}
```

// 我很纠结关于如何清楚地将内存结构表述出来. 文字肯定是不够的. 这里就自行理解吧, 以后的我.

## free

free 实际是将已分配内存再度 push 回栈

```c
/* Declaration changed to standard one for GNU.  */
void
free (void *base)
{
	header_t h;
	free_list_t fl;
	int i;

	if (base == 0)
		return;
	/*
	 * Find free list for block.
	 */
	// 这里再度取回之前放在前面的入口
	h = (header_t) (base - HEADER_SIZE);

#ifdef MCHECK
	assert (HEADER_CHECK (h) == CHECK_BUSY);
#endif

	// 转换成入口
	fl = HEADER_FREE (h);
	i = fl - malloc_free_list;
	/*
	 * Sanity checks.
	 */
	if (i < 0 || i >= NBUCKETS) {
		ASSERT(0 <= i && i < NBUCKETS);
		return;
	}
	if (fl != &malloc_free_list[i]) {
		ASSERT(fl == &malloc_free_list[i]);
		return;
	}
	/*
	 * Push block on free list.
	 */
	// @note 
	spin_lock(&fl->lock);
	// 保存当前 head 至 h 中
	HEADER_NEXT (h) = fl->head;
#ifdef MCHECK
	HEADER_CHECK (h) = CHECK_FREE;
#endif
	// 将当前被释放节点放回 head
	fl->head = h;
#endif	/* DEBUG */
	spin_unlock(&fl->lock);
	return;
}
```

那么. glibc 如何管理内存的基础就大致了解了. 继续了解其他如 realloc 函数的实现.

## realloc

```c
/* Declaration changed to standard one for GNU.  */
void *
realloc (void *old_base, size_t new_size)
{
	header_t h;
	free_list_t fl;
	int i;
	unsigned int old_size;
	char *new_base;

	if (old_base == 0)
	  return malloc (new_size);

	/*
	 * Find size of old block.
	 */
	h = (header_t) (old_base - HEADER_SIZE);
#ifdef MCHECK
	assert (HEADER_CHECK (h) == CHECK_BUSY);
#endif
	fl = HEADER_FREE (h);
	i = fl - malloc_free_list;
	/*
	 * Sanity checks.
	 */
	if (i < 0 || i >= NBUCKETS) {
		ASSERT(0 <= i && i < NBUCKETS);
		return 0;
	}
	if (fl != &malloc_free_list[i]) {
		ASSERT(fl == &malloc_free_list[i]);
		return 0;
	}
	/*
	 * Free list with index i contains blocks of size
	 * 2 ^ (i + * LOG2_MIN_SIZE) including header.
	 */
	old_size = (1 << (i + LOG2_MIN_SIZE)) - HEADER_SIZE;

	if (new_size <= old_size
	    && new_size > (((old_size + HEADER_SIZE) >> 1) - HEADER_SIZE))
	  /* The new size still fits in the same block, and wouldn't fit in
	     the next smaller block!  */
	  return old_base;

	/*
	 * Allocate new block, copy old bytes, and free old block.
	 */
	new_base = malloc(new_size);
	if (new_base)
	  memcpy (new_base, old_base,
		  (int) (old_size < new_size ? old_size : new_size));

	if (new_base || new_size == 0)
	  /* Free OLD_BASE, but only if the malloc didn't fail.  */
	  free (old_base);

	return new_base;
}
```

唔 🙄 看起来就是单纯的重新分配指定大小的内存. old_base 只是用来析构的.

## others

```c
void
_hurd_malloc_fork_prepare(void)
/*
 * Prepare the malloc module for a fork by insuring that no thread is in a
 * malloc critical section.
 */
// 原来 fork 也会卡进程啊. 不看这句注释我还不知道.
// 也是呢. 毕竟新进程的东西部分可以与旧进程共享嘛.
{
    int i;

    for (i = 0; i < NBUCKETS; i++) {
	spin_lock(&malloc_free_list[i].lock);
    }
}

void
_hurd_malloc_fork_parent(void)
/*
 * Called in the parent process after a fork() to resume normal operation.
 */
// 加锁也伴随着解锁.
{
    int i;

    for (i = NBUCKETS-1; i >= 0; i--) {
	spin_unlock(&malloc_free_list[i].lock);
    }
}

void
_hurd_malloc_fork_child(void)
/*
 * Called in the child process after a fork() to resume normal operation.
 */
// 也是呢. 毕竟在 fork 之前加锁. 那么 child 和 parent 都需要解锁呢.
{
    int i;

    for (i = NBUCKETS-1; i >= 0; i--) {
	spin_unlock(&malloc_free_list[i].lock);
    }
}
```

那么, 内存的分配和释放这块就简单了解了.

- [ ]  更加底层的 vm_alloc 相关函数
