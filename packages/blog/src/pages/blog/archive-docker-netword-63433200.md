---
title: "Docker netword"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/63433200bf9e41edad287a9871cc794a"
---

突然想到一些问题. 比如, 当你使用 container 技术时. 数据库是放在容器内部还是宿主主机?

如果放在宿主主机, container 如何与宿主沟通? container 之间如何沟通? 

所以就有了今天的笔记. 目标是初步探索一下 container 的网络 (PS: 其实和 netword bridge 几乎没什么区别 = =)

因为写之前已经踩过一些坑了, 所以就简单直接地揭露一下核心. 按照我归纳的方法. 无论是宿主和 container 亦或是 container 之间. 通信方式有两种.

1. 由 docker 命令行/Dockerfile 提供的端口转换.
2. 由 docker0 提供的 netword bridge 接口.

其区别是, 前者访问宿主主机 IP 和端口, 宿主主机转发其数据至对应 container.

后者直接通过 docker0 netword bridge 发送协议 (类型于 eth0, 即 localhost)

宿主(host) 网络环境:

```bash
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 52:54:00:7a:7e:d4 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.13/20 brd 172.17.15.255 scope global eth0
       valid_lft forever preferred_lft forever
3: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether 02:42:39:ea:ee:83 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.1/16 brd 172.18.255.255 scope global docker0
       valid_lft forever preferred_lft forever
17: veth1769e6a@if16: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker0 state UP group default 
    link/ether f2:12:63:58:e6:ed brd ff:ff:ff:ff:ff:ff link-netnsid 0
21: vethb643e9b@if20: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker0 state UP group default 
    link/ether f2:3f:70:32:d3:16 brd ff:ff:ff:ff:ff:ff link-netnsid 1
```

通信使用 nc 和 telnet 指令.

以下是操作步骤 (第一次用 asciinema 😆)

host → container 

[untitled](https://asciinema.org/a/E1LDBtT0FqxexKyxKtTbhbzXe)

简单来说就是运行 docker . 设置端口转发. 然后用本地的 telnet [localhost](http://localhost) IP.

也可以用 docker inspect 查看 container 的 IP. 然后直接发送给 container. 反之同理.

container 和 container 的操作也是一样的. 这里就不赘述了. (其实是我懒...)
