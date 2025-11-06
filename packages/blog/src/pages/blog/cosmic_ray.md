---
title: "Cosmic Ray Bit Flipping"
pubDate: 2025-11-07
---

事情要源自 MongoDB 中的 Primary-Key  
当使用 Insert 之类的指令向 MongoDB 插入数据而不带主键时, MongoDB 会自动创建一个主键, 具体是:

> \_id
> A field required in every MongoDB document. The \_id field must have a unique value. You can think of the \_id field as the document's primary key. If you create a new document without an \_id field, MongoDB automatically creates the field and assigns a unique BSON ObjectId to the field.

对于 ObjectId 的定义则是:

> ObjectId
> A 12-byte BSON type that is unique within a collection. The ObjectId is generated using the timestamp, computer ID, process ID, and a local process incremental counter. MongoDB uses ObjectId values as the default values for \_id fields.

也就是说, 这是一个拼接而成的字段, 非纯随机, 也非自增
但是拼接的字段也有可能重复

> timestamp, computer ID, process ID, and a local process incremental counter

如果在同一秒内, 同一主机, MongoDB 重启且获得了同样的进程 ID, 同时这个自增的 Counter 也一样的话, 那么就会出现碰撞, 虽然我问过 AI , AI 回复极小可能出现这种情况(仅理论存在). 但还是难免不介怀

这种状况在其他数据库中也存在, 如果要一个绝对唯一的 ID, 那么最安全的做法是一个自增的 ID. 但这么做的并发性很差, 而如果要一个并发性很好的 ID, 那么就是随机的 ID, 虽然碰撞的可能性很小, 但依旧要做插入失败的处理

似乎只能在这两种方式之间做取舍, 要么舍弃性能, 要么接受可能存在的碰撞  
如果只是这样, 也不会出现这篇笔记. 有趣的是我在查阅相关资料的时候, 了解到了 [Cosmic Ray Bit Flipping](https://en.wikipedia.org/wiki/Soft_error) 这个概念. 继而这个问题有趣了起来

而要具体了解这个问题, 除了 wiki 上的内容, 可以看看这个视频:  
{%preview https://www.youtube.com/watch?v=AaZ_RSt0KP8 %}

那么, 在看完 wiki 和视频后, 我可以很确定地说, 我会选择哪种方式  
那当然是随机了, 虽然有概率发生, 但本来就没有绝对安全的计算机软件  
同时, 如果 Cosmic Ray 真的发生了, 改变了我的自增 Counter. 那么问题就麻烦了, 因为这种设计就假设 Counter 是自增的, 反观随机数, 没有对其值有任何假设
