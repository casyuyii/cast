---
title: "NUMA"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/7a45e606dcce4a0d851393583a526228"
---

最近还是在看 Linux 内存分配那块的代码. 看得头昏脑涨.

突然有了些理解. 当你要看某个技术的代码时. 直接去看并不一定是好的选择. 

通常你需要了解: 这个技术的服务对象, 技术相关的基础知识. 

比如这次. 我做的准备太少了. 我不知道底层硬件. 也不知道所面临的问题. 不知道相关技术. 也就不知道这个技术的服务对象. 所以总是不明白. 看懂了也不明白. 

就好像一个符号. 能清楚看到外形, 但不明白其代表的含义. :(

(突然想起了红老师的: 料理就是物理, 料理就是政治... 或许一开始我就把这些事情想得太简单了, 也或许是我潜意识偷懒了, 觉得看源码就行了. 然而实际不是这么简单的.)

说回来. 所以我就找了些文档仔细看看. 

[What is NUMA? - The Linux Kernel documentation](https://www.kernel.org/doc/html/v4.18/vm/numa.html)

## **What is NUMA?**

This question can be answered from a couple of perspectives: the hardware view and the Linux software view.

From the hardware perspective, a NUMA system is a computer platform that comprises multiple components or assemblies each of which may contain 0 or more CPUs, local memory, and/or IO buses. For brevity and to disambiguate the hardware view of these physical components/assemblies from the software abstraction thereof, we’ll call the components/assemblies ‘cells’ in this document.

NUMA 系统是一个由多个部件组成的电脑平台. (比如下面我找的图, 有 2 个 CPU. 12 根内存插条.) 这些部件包含 0 或多个 CPU, 具部内存, IO 总线.

[https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcS2BzZ9NIEjINbNovG6XRj8j2fQ_u2o7ZzzyaVLzGnc_xXgd35-B5pT6SaImptV1a9H1iH42fH6aLUH0AH19cQ-gpMRSy-4rw](https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcS2BzZ9NIEjINbNovG6XRj8j2fQ_u2o7ZzzyaVLzGnc_xXgd35-B5pT6SaImptV1a9H1iH42fH6aLUH0AH19cQ-gpMRSy-4rw)

Each of the ‘cells’ may be viewed as an SMP [symmetric multi-processor] subset of the system–although some components necessary for a stand-alone SMP system may not be populated on any given cell. The cells of the NUMA system are connected together with some sort of system interconnect–e.g., a crossbar or point-to-point link are common types of NUMA system interconnects. Both of these types of interconnects can be aggregated to create NUMA platforms with cells at multiple distances from other cells. 

每个'单元'被视作系统的一个 SMP 子集. (即使部分对于独立 SMP 系统必要的部件未存在在任何指定'单元'中)(PS: 这里我是这么理解的. 将 NUMA 看作多 CPU 系统. 每个 CPU 可被看作 SMP 架构(多核 CPU). 但是这区别于实际的 SMP 系统.) NUMA 系统的单元由某种系统内部链接连接在一起. 

For Linux, the NUMA platforms of interest are primarily what is known as Cache Coherent NUMA or ccNUMA systems. With ccNUMA systems, all memory is visible to and accessible from any CPU attached to any cell and cache coherency is handled in hardware by the processor caches and/or the system interconnect.

对于 Linux 而言. 感兴趣的 NUMA 平台主要是缓存一致 NUMA 或 ccNUMA 系统. ccNUMA 系统中. 所有内存对附加于任意单元的任意 CPU 可见/可访问. 缓存一致性由硬件的处理器缓存/系统内部链接处理.

Memory access time and effective memory bandwidth varies depending on how far away the cell containing the CPU or IO bus making the memory access is from the cell containing the target memory. For example, access to memory by CPUs attached to the same cell will experience faster access times and higher bandwidths than accesses to memory on other, remote cells. NUMA platforms can have cells at multiple remote distances from any given cell.

内存访问时间和带宽取决于包含执行内存访问的 CPU/IO 总线的单元和包含目标内存单元的距离(PS: 这句话好绕口. 简单来说就是效率取决于距离.)

(PS: 然后就是比较重点地方了.

Platform vendors don’t build NUMA systems just to make software developers’ lives interesting. Rather, this architecture is a means to provide scalable memory bandwidth. However, to achieve scalable memory bandwidth, system and application software must arrange for a large majority of the memory references [cache misses] to be to “local” memory–memory on the same cell, if any–or to the closest cell with memory.

为了获取可变的内存带宽. 系统和应用程序必须规划大部分内存引用变为具部内存(在同一单元的内存)

This leads to the Linux software view of a NUMA system:

这引出了 Linux 软件视点的 NUMA 系统:

Linux divides the system’s hardware resources into multiple software abstractions called “nodes”. Linux maps the nodes onto the physical cells of the hardware platform, abstracting away some of the details for some architectures. As with physical cells, software nodes may contain 0 or more CPUs, memory and/or IO buses. And, again, memory accesses to memory on “closer” nodes–nodes that map to closer cells–will generally experience faster access times and higher effective bandwidth than accesses to more remote cells.

Linux 将系统硬件资源分为对各软件抽象, 称为 "节点". (PS: 看到这里我枯了, 我在源码中无数次看到 node 字样. 但就是不太明白是什么东西). Linux 将这些节点映射到物理内存中. 将一些架构细节抽象化. 就像物理单元一样. 软件节点可能包含多个 CPUs, 内存, IO 总线(为什么又是这些啊 = =). 同样的, 访问较近节点(物理靠近单元的内存)通常会获得更快的访问速度和更高的有效带宽. 

For some architectures, such as x86, Linux will “hide” any node representing a physical cell that has no memory attached, and reassign any CPUs attached to that cell to a node representing a cell that does have memory. Thus, on these architectures, one cannot assume that all CPUs that Linux associates with a given node will see the same local memory access times and bandwidth.

对于一些架构, 如 x86, Linux 将会隐藏没有内存附加的单元节点. 同时重新分配附加到单元的任意CPUs至表示为有内存的单元的节点.(PS: 简单理解的话, 就是将没有次元的节点重分配有节点. 做了一层抽象.)因此, 在某些架构中, 指定节点所关联的所有 CPUs 不一定能有同样的布局内存访问时间和带宽.(PS: 我不是很清楚这里的含义, 简单理解的话, 就是: 因为资源会重新分配. 同样节点中, 也不一定会有同样的内存访问时间和带宽.)

In addition, for some architectures, again x86 is an example, Linux supports the emulation of additional nodes. For NUMA emulation, linux will carve up the existing nodes–or the system memory for non-NUMA platforms–into multiple nodes. Each emulated node will manage a fraction of the underlying cells’ physical memory. NUMA emluation is useful for testing NUMA kernel and application features on non-NUMA platforms, and as a sort of memory resource management mechanism when used together with cpusets. [see Documentation/cgroup-v1/cpusets.txt]

Linux 还支持模拟额外的节点. 每个节点管理部分底层单元物理内存. 

For each node with memory, Linux constructs an independent memory management subsystem, complete with its own free page lists, in-use page lists, usage statistics and locks to mediate access. In addition, Linux constructs for each memory zone [one or more of DMA, DMA32, NORMAL, HIGH_MEMORY, MOVABLE], an ordered “zonelist”. A zonelist specifies the zones/nodes to visit when a selected zone/node cannot satisfy the allocation request. This situation, when a zone has no available memory to satisfy a request, is called “overflow” or “fallback”.

Linux 为每个节点构建独立的内存管理子系统. (free/in-use 页链表, 使用统计和锁) Linux 还为每隔内存区域构建一个顺序 'zonelist'. 当指定的 zone/node 不能满足分配需求时. zonelist 指定 zones/nodes 访问. 

Because some nodes contain multiple zones containing different types of memory, Linux must decide whether to order the zonelists such that allocations fall back to the same zone type on a different node, or to a different zone type on the same node. This is an important consideration because some zones, such as DMA or DMA32, represent relatively scarce resources. Linux chooses a default Node ordered zonelist. This means it tries to fallback to other zones from the same node before using remote nodes which are ordered by NUMA distance.

因为节点包含多个区域, 包含多种类型的内存. Linux 必须决定是都排序 zonelists, 使分配回退到不同节点的同一区域. 或者在同一节点的不同区域类型. 这意味着尝试 fallback 到同样节点的不同区域. 

By default, Linux will attempt to satisfy memory allocation requests from the node to which the CPU that executes the request is assigned. Specifically, Linux will attempt to allocate from the first node in the appropriate zonelist for the node where the request originates. This is called “local allocation.” If the “local” node cannot satisfy the request, the kernel will examine other nodes’ zones in the selected zonelist looking for the first zone in the list that can satisfy the request.

通常, Linux 会尝试满足节点到被分配请求的 CPU 的内存分配请求. (PS: 该说严谨呢还是啰嗦呢, 文档总是这样 :( ... ). Linux 会尝试从请求的节点的适当 zonelist 的第一个 node 分配. 这称为 '局部分配'. 如果局部节点不能满足请求. kernel 将会检查 zonelist 的其他 node. 在链表中寻找第一个满足请求的节点. 

Local allocation will tend to keep subsequent access to the allocated memory “local” to the underlying physical resources and off the system interconnect– as long as the task on whose behalf the kernel allocated some memory does not later migrate away from that memory. The Linux scheduler is aware of the NUMA topology of the platform–embodied in the “scheduling domains” data structures [see Documentation/scheduler/sched-domains.txt]–and the scheduler attempts to minimize task migration to distant scheduling domains. However, the scheduler does not take a task’s NUMA footprint into account directly. Thus, under sufficient imbalance, tasks can migrate between nodes, remote from their initial node and kernel data structures.

局部分配倾向于保持随后对分配的内存为'局部的', 并且切断内部系统连接. —— 只要内核为其分配了一些内存的任务后没有从该内存中迁出出去. Linux 调度器注意到在"scheduling domains"中基础平台 NUMA 的拓扑学(PS: 什么东西 = =). 同时调度器尝试减少任务迁移到其他调度域的操作. 

System administrators and application designers can restrict a task’s migration to improve NUMA locality using various CPU affinity command line interfaces, such as taskset(1) and numactl(1), and program interfaces such as sched_setaffinity(2). Further, one can modify the kernel’s default local allocation behavior using Linux NUMA memory policy. [see Documentation/admin-guide/mm/numa_memory_policy.rst.]

系统管理员和应用设计者可以使用多种 CPU 相关的命令行限制任务的迁移以提升 NUMA 局部性. 比如 taskset, numactl, 以及如 sched_setaffinity 的编程接口. 还可以使用 Linux NUMA 的内存策略更改内核的默认局部分配行为. 

System administrators can restrict the CPUs and nodes’ memories that a non- privileged user can specify in the scheduling or NUMA commands and functions using control groups and CPUsets. [see Documentation/cgroup-v1/cpusets.txt]

系统管理员可以用 control group 和 CPUset在 scheduling/NUMA 命令行中限制非特权用户可使用的 CPUs 和 节点的内存.

On architectures that do not hide memoryless nodes, Linux will include only zones [nodes] with memory in the zonelists. This means that for a memoryless node the “local memory node”–the node of the first zone in CPU’s node’s zonelist–will not be the node itself. Rather, it will be the node that the kernel selected as the nearest node with memory when it built the zonelists. So, default, local allocations will succeed with the kernel supplying the closest available memory. This is a consequence of the same mechanism that allows such allocations to fallback to other nearby nodes when a node that does contain memory overflows.

在不隐藏无内存节点的架构上, Linux 将智慧包含在 zonelists 中的 zones. 这意为着对于无内存节点而言. "local memory node"— 在 CPU's 节点中 zonelist 的第一个 zone, 将会是节点自身. 

Some kernel allocations do not want or cannot tolerate this allocation fallback behavior. Rather they want to be sure they get memory from the specified node or get notified that the node has no free memory. This is usually the case when a subsystem allocates per CPU memory resources, for example.

A typical model for making such an allocation is to obtain the node id of the node to which the “current CPU” is attached using one of the kernel’s numa_node_id() or CPU_to_node() functions and then request memory from only the node id returned. When such an allocation fails, the requesting subsystem may revert to its own fallback path. The slab kernel memory allocator is an example of this. Or, the subsystem may choose to disable or not to enable itself on allocation failure. The kernel profiling subsystem is an example of this.

If the architecture supports–does not hide–memoryless nodes, then CPUs attached to memoryless nodes would always incur the fallback path overhead or some subsystems would fail to initialize if they attempted to allocated memory exclusively from a node without memory. To support such architectures transparently, kernel subsystems can use the numa_mem_id() or cpu_to_mem() function to locate the “local memory node” for the calling or specified CPU. Again, this is the same node from which default, local page allocations will be attempted.
