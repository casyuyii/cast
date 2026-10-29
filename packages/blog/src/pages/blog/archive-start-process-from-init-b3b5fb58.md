---
title: "Start process from init"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/b3b5fb58545048a8a62c413512455f7d"
---

又突然想到一个问题. (现任公司程序)启动时, 默认 parent 为 1. 这是如何做到的?

Linux 应该没有类似 setppid 的函数. 

正常来说, 使用 ssh 命令行启动的程序的父进程应该就是 ssh 会话. 而在 ssh 会话中断时, SIGHUP 信号发送. 未设置该信号捕捉的默认行为则是终止. 参见 :

[https://man7.org/linux/man-pages/man7/signal.7.html](https://man7.org/linux/man-pages/man7/signal.7.html)

我查阅了部分资料. 让进程的父进程为 1 的方式只有这一种(忽略 SIGHUP, 进程将由 1 进程接管). 

(我并不确定是否是这种方法. 但应该是类似的方法.)

几种即使在命令行状态下运行程序, 程序也不会在退出时终止的方法. 

[https://linoxide.com/keep-processes-running-ssh-logout-linux/](https://linoxide.com/keep-processes-running-ssh-logout-linux/)

PS: 我观察了一下, 大致都是会在退出时/运行时挂在 root 下.
