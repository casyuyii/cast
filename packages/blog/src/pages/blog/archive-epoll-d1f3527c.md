---
title: "epoll"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/d1f3527c56de4a02b3e3e64ee68cc4fa"
---

epoll 的大概实现基于回调. 当文件被写入时, 回调指定函数, 将其加入到 wait_queue 中.

当 epoll_wait 调用时, 无需遍历已监听节点, 可直接使用 wait_queue 中的节点. 这样通过一种 "顺势而为" 的操作, 提高了效率. 

(以上是我观察源码时所看到的总结. 其实现有差异, 但可以这么简单理解)

然后, 现在像分析一些不太明白/有意思的点. 

1. 文件自身必须直接 poll
    
    之前也说到了, epoll 通过回调函数来实现. 我本来以为这些回调是通过 epoll_ctl 增加对应的函数指针来实现的. 但好像不对. 源码中明确了, 文件自身必须支持 poll 回调.
    
    以下是 epoll_ctl 的部分代码:
    
    ```c
    int do_epoll_ctl(int epfd, int op, int fd, struct epoll_event *epds,
    		 bool nonblock)
    {
    	int error;
    	int full_check = 0;
    	struct fd f, tf;
    	struct eventpoll *ep;
    	struct epitem *epi;
    	struct eventpoll *tep = NULL;
    
    	error = -EBADF;
    	f = fdget(epfd);
    	if (!f.file)
    		goto error_return;
    
    	/* Get the "struct file *" for the target file */
    	tf = fdget(fd);
    	if (!tf.file)
    		goto error_fput;
    
    	/* The target file descriptor must support poll */
    	error = -EPERM;
    	if (!file_can_poll(tf.file))
    		goto error_tgt_fput;
    ```
    
    其中 file_can_poll 的代码如下:
    
    ```c
    static inline bool file_can_poll(struct file *file)
    {
    	return file->f_op->poll;
    }
    ```
    
    完整的 file_operation 为:
    
    ```c
    struct file_operations {
    	struct module *owner;
    	loff_t (*llseek) (struct file *, loff_t, int);
    	ssize_t (*read) (struct file *, char __user *, size_t, loff_t *);
    	ssize_t (*write) (struct file *, const char __user *, size_t, loff_t *);
    	ssize_t (*read_iter) (struct kiocb *, struct iov_iter *);
    	ssize_t (*write_iter) (struct kiocb *, struct iov_iter *);
    	int (*iopoll)(struct kiocb *kiocb, bool spin);
    	int (*iterate) (struct file *, struct dir_context *);
    	int (*iterate_shared) (struct file *, struct dir_context *);
    	__poll_t (*poll) (struct file *, struct poll_table_struct *);
    	long (*unlocked_ioctl) (struct file *, unsigned int, unsigned long);
    	long (*compat_ioctl) (struct file *, unsigned int, unsigned long);
    	int (*mmap) (struct file *, struct vm_area_struct *);
    	unsigned long mmap_supported_flags;
    	int (*open) (struct inode *, struct file *);
    	int (*flush) (struct file *, fl_owner_t id);
    	int (*release) (struct inode *, struct file *);
    	int (*fsync) (struct file *, loff_t, loff_t, int datasync);
    	int (*fasync) (int, struct file *, int);
    	int (*lock) (struct file *, int, struct file_lock *);
    	ssize_t (*sendpage) (struct file *, struct page *, int, size_t, loff_t *, int);
    	unsigned long (*get_unmapped_area)(struct file *, unsigned long, unsigned long, unsigned long, unsigned long);
    	int (*check_flags)(int);
    	int (*flock) (struct file *, int, struct file_lock *);
    	ssize_t (*splice_write)(struct pipe_inode_info *, struct file *, loff_t *, size_t, unsigned int);
    	ssize_t (*splice_read)(struct file *, loff_t *, struct pipe_inode_info *, size_t, unsigned int);
    	int (*setlease)(struct file *, long, struct file_lock **, void **);
    	long (*fallocate)(struct file *file, int mode, loff_t offset,
    			  loff_t len);
    	void (*show_fdinfo)(struct seq_file *m, struct file *f);
    #ifndef CONFIG_MMU
    	unsigned (*mmap_capabilities)(struct file *);
    #endif
    	ssize_t (*copy_file_range)(struct file *, loff_t, struct file *,
    			loff_t, size_t, unsigned int);
    	loff_t (*remap_file_range)(struct file *file_in, loff_t pos_in,
    				   struct file *file_out, loff_t pos_out,
    				   loff_t len, unsigned int remap_flags);
    	int (*fadvise)(struct file *, loff_t, loff_t, int);
    } __randomize_layout;
    ```
    
    emm. 但是很奇怪的是, 我之前看的时候, 发现, 基础文件函数是没有这个函数指针的. 所以, 来找一下, 分别以 socket 和 open 及 fopen 创建的文件描述符为例. 
    
    PS: 有一处有趣的地方:
    
    ```c
    int sock_create(int family, int type, int protocol, struct socket **res)
    {
    	return __sock_create(current->nsproxy->net_ns, family, type, protocol, res, 0);
    }
    EXPORT_SYMBOL(sock_create);
    ```
    
    这里 __sock_create 的首个参数表明, 资源被创建再对应的 namespace 中.
    
    emm. 为什么? namespace 是系统级别的隔离. 也就是说, sock 也是系统级别的资源?
