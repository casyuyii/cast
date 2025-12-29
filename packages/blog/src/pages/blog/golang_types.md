---
title: "Golang Types"
pubDate: 2025-12-29
---

Golang Runtime 有非常多值得深思的技术, 而要了解这些技术, 最初的步骤之一应该就是理解其中的类型定义了  
这些类型为了支持运行时, 与传统的编译语言不同, 在编译后依旧保留了相当多的信息

源文件请参考 Golang 1.25 分支中 abi 包中的 Type 相关定义  
(ABI 意为 Application Binary Interface, 即应用程序二进制接口, 用于描述类型在内存中的布局.)

```go
// Type is the runtime representation of a Go type.
//
// Be careful about accessing this type at build time, as the version
// of this type in the compiler/linker may not have the same layout
// as the version in the target binary, due to pointer width
// differences and any experiments. Use cmd/compile/internal/rttype
// or the functions in compiletype.go to access this type instead.
// (TODO: this admonition applies to every type in this package.
// Put it in some shared location?)
type Type struct {
	Size_       uintptr
	PtrBytes    uintptr // number of (prefix) bytes in the type that can contain pointers
	Hash        uint32  // hash of type; avoids computation in hash tables
	TFlag       TFlag   // extra type information flags
	Align_      uint8   // alignment of variable with this type
	FieldAlign_ uint8   // alignment of struct field with this type
	Kind_       Kind    // enumeration for C
	// function for comparing objects of this type
	// (ptr to object A, ptr to object B) -> ==?
	Equal func(unsafe.Pointer, unsafe.Pointer) bool
	// GCData stores the GC type data for the garbage collector.
	// Normally, GCData points to a bitmask that describes the
	// ptr/nonptr fields of the type. The bitmask will have at
	// least PtrBytes/ptrSize bits.
	// If the TFlagGCMaskOnDemand bit is set, GCData is instead a
	// **byte and the pointer to the bitmask is one dereference away.
	// The runtime will build the bitmask if needed.
	// (See runtime/type.go:getGCMask.)
	// Note: multiple types may have the same value of GCData,
	// including when TFlagGCMaskOnDemand is set. The types will, of course,
	// have the same pointer layout (but not necessarily the same size).
	GCData    *byte
	Str       NameOff // string form
	PtrToThis TypeOff // type for pointer to this type, may be zero
}
```

Type 是所有 Golnag 类型都有的一个数据定义结构, 这些类型包含自定义类型, 如 **struct**, 由所有实例共享  
**PtrByte** 指的是具体类型中, 前多少个字节可能包含指针. 这个字段用于 GC, 所以理论上来说, 将指针字段前置是有利于 GC 的(因为 GC 只需要遍历前 N 个字节即可)  
**Equal** 展示了运行时如何比较两个类型是否相等, 这应该会用到 **Str** 字段, 稍后会看到, 它类型的字符串

```go
// A Kind represents the specific kind of type that a Type represents.
// The zero Kind is not a valid kind.
type Kind uint8

const (
	Invalid Kind = iota
	Bool
	Int
	Int8
	Int16
	Int32
	Int64
	Uint
	Uint8
	Uint16
	Uint32
	Uint64
	Uintptr
	Float32
	Float64
	Complex64
	Complex128
	Array
	Chan
	Func
	Interface
	Map
	Pointer
	Slice
	String
	Struct
	UnsafePointer
)

const (
	// TODO (khr, drchase) why aren't these in TFlag?  Investigate, fix if possible.
	KindDirectIface Kind = 1 << 5
	KindMask        Kind = (1 << 5) - 1
)

// TFlag is used by a Type to signal what extra type information is
// available in the memory directly following the Type value.
type TFlag uint8

const (
	// TFlagUncommon means that there is a data with a type, UncommonType,
	// just beyond the shared-per-type common data.  That is, the data
	// for struct types will store their UncommonType at one offset, the
	// data for interface types will store their UncommonType at a different
	// offset.  UncommonType is always accessed via a pointer that is computed
	// using trust-us-we-are-the-implementors pointer arithmetic.
	//
	// For example, if t.Kind() == Struct and t.tflag&TFlagUncommon != 0,
	// then t has UncommonType data and it can be accessed as:
	//
	//	type structTypeUncommon struct {
	//		structType
	//		u UncommonType
	//	}
	//	u := &(*structTypeUncommon)(unsafe.Pointer(t)).u
	TFlagUncommon TFlag = 1 << 0

	// TFlagExtraStar means the name in the str field has an
	// extraneous '*' prefix. This is because for most types T in
	// a program, the type *T also exists and reusing the str data
	// saves binary size.
	TFlagExtraStar TFlag = 1 << 1

	// TFlagNamed means the type has a name.
	TFlagNamed TFlag = 1 << 2

	// TFlagRegularMemory means that equal and hash functions can treat
	// this type as a single region of t.size bytes.
	TFlagRegularMemory TFlag = 1 << 3

	// TFlagGCMaskOnDemand means that the GC pointer bitmask will be
	// computed on demand at runtime instead of being precomputed at
	// compile time. If this flag is set, the GCData field effectively
	// has type **byte instead of *byte. The runtime will store a
	// pointer to the GC pointer bitmask in *GCData.
	TFlagGCMaskOnDemand TFlag = 1 << 4
)

// NameOff is the offset to a name from moduledata.types.  See resolveNameOff in runtime.
type NameOff int32

// TypeOff is the offset to a type from moduledata.types.  See resolveTypeOff in runtime.
type TypeOff int32

// TextOff is an offset from the top of a text section.  See (rtype).textOff in runtime.
type TextOff int32

// String returns the name of k.
func (k Kind) String() string {
	if int(k) < len(kindNames) {
		return kindNames[k]
	}
	return kindNames[0]
}

var kindNames = []string{
	Invalid:       "invalid",
	Bool:          "bool",
	Int:           "int",
	Int8:          "int8",
	Int16:         "int16",
	Int32:         "int32",
	Int64:         "int64",
	Uint:          "uint",
	Uint8:         "uint8",
	Uint16:        "uint16",
	Uint32:        "uint32",
	Uint64:        "uint64",
	Uintptr:       "uintptr",
	Float32:       "float32",
	Float64:       "float64",
	Complex64:     "complex64",
	Complex128:    "complex128",
	Array:         "array",
	Chan:          "chan",
	Func:          "func",
	Interface:     "interface",
	Map:           "map",
	Pointer:       "ptr",
	Slice:         "slice",
	String:        "string",
	Struct:        "struct",
	UnsafePointer: "unsafe.Pointer",
}
```

类型的 ENUM 以及字段串值. Golang 将其所用到的类型都定义了, 而 **any** 类型, 实际是一个 **interface{}** 的别名
其中, 需要注意的是 function 类型, 它被视作一种类型. Golang 中, 可以向 function 添加 method, 从而使 function 也可作为 interface 传递:

```go
package main

import "fmt"

// 1. Define an interface
type Worker interface {
	Work(x int) int
	Name() string
}

// 2. Define a named function type
type WorkFunc func(int) int

// 3. Attach methods to the function type
func (f WorkFunc) Work(x int) int {
	return f(x)
}

func (f WorkFunc) Name() string {
	return "WorkFunc implementation"
}

// 4. Function that accepts the interface
func Run(w Worker) {
	fmt.Println("Name:", w.Name())
	fmt.Println("Result:", w.Work(10))
}

// 5. Main entry
func main() {
	// ordinary function
	double := func(x int) int {
		return x * 2
	}

	// convert function to WorkFunc and pass as interface
	Run(WorkFunc(double))
}
```

**interface** 让 Golang 的类型系统变得十分灵活, 不同于 C++ 的 class 继承机制, 其多态由 virtual pointer 实现, 有单一的继承链, 而 Golang 没有, 实现了 interface 定义的所有方法的类型, 都可作为参数传递  
这样做不是没有代价的, 因为同一类型可能实现多个 interface, 但多个 interface 可以包含同样的方法, 且顺序可以不同, 这使得实现了同一 interface 的类型, 其类型描述不能共享  
Golang 为每个 interface 和实现了其定义的所有方法的类型, 都会生成一个类型描述. 比如 A, B 类型实现了 interface X, Y, Z, 那么将有 6 个类型描述(A, X) (A, Y) (A, Z) (B, X) (B, Y) (B, Z)

```go

// Method on non-interface type
type Method struct {
	Name NameOff // name of method
	Mtyp TypeOff // method type (without receiver)
	Ifn  TextOff // fn used in interface call (one-word receiver)
	Tfn  TextOff // fn used for normal method call
}

// UncommonType is present only for defined types or types with methods
// (if T is a defined type, the uncommonTypes for T and *T have methods).
// Using a pointer to this struct reduces the overall size required
// to describe a non-defined type with no methods.
type UncommonType struct {
	PkgPath NameOff // import path; empty for built-in types like int, string
	Mcount  uint16  // number of methods
	Xcount  uint16  // number of exported methods
	Moff    uint32  // offset from this uncommontype to [mcount]Method
	_       uint32  // unused
}

func (t *UncommonType) Methods() []Method {
	if t.Mcount == 0 {
		return nil
	}
	return (*[1 << 16]Method)(addChecked(unsafe.Pointer(t), uintptr(t.Moff), "t.mcount > 0"))[:t.Mcount:t.Mcount]
}

func (t *UncommonType) ExportedMethods() []Method {
	if t.Xcount == 0 {
		return nil
	}
	return (*[1 << 16]Method)(addChecked(unsafe.Pointer(t), uintptr(t.Moff), "t.xcount > 0"))[:t.Xcount:t.Xcount]
}

// addChecked returns p+x.
//
// The whySafe string is ignored, so that the function still inlines
// as efficiently as p+x, but all call sites should use the string to
// record why the addition is safe, which is to say why the addition
// does not cause x to advance to the very end of p's allocation
// and therefore point incorrectly at the next block in memory.
func addChecked(p unsafe.Pointer, x uintptr, whySafe string) unsafe.Pointer {
	return unsafe.Pointer(uintptr(p) + x)
}

// Imethod represents a method on an interface type
type Imethod struct {
	Name NameOff // name of method
	Typ  TypeOff // .(*FuncType) underneath
}
```

导出/未导出的 **method** 分组放在了一起, 性能的同时兼顾了隔离

```go
// ArrayType represents a fixed array type.
type ArrayType struct {
	Type
	Elem  *Type // array element type
	Slice *Type // slice type
	Len   uintptr
}

// Len returns the length of t if t is an array type, otherwise 0
func (t *Type) Len() int {
	if t.Kind() == Array {
		return int((*ArrayType)(unsafe.Pointer(t)).Len)
	}
	return 0
}

func (t *Type) Common() *Type {
	return t
}

type ChanDir int

const (
	RecvDir    ChanDir = 1 << iota         // <-chan
	SendDir                                // chan<-
	BothDir            = RecvDir | SendDir // chan
	InvalidDir ChanDir = 0
)

// ChanType represents a channel type
type ChanType struct {
	Type
	Elem *Type
	Dir  ChanDir
}

type structTypeUncommon struct {
	StructType
	u UncommonType
}

// ChanDir returns the direction of t if t is a channel type, otherwise InvalidDir (0).
func (t *Type) ChanDir() ChanDir {
	if t.Kind() == Chan {
		ch := (*ChanType)(unsafe.Pointer(t))
		return ch.Dir
	}
	return InvalidDir
}

type SliceType struct {
	Type
	Elem *Type // slice element type
}

type StructField struct {
	Name   Name    // name is always non-empty
	Typ    *Type   // type of field
	Offset uintptr // byte offset of field
}

func (f *StructField) Embedded() bool {
	return f.Name.IsEmbedded()
}

type StructType struct {
	Type
	PkgPath Name
	Fields  []StructField
}
```

**Array** **Channel** **Struct** 的类型定义, 还在意料之中

```go
// Uncommon returns a pointer to T's "uncommon" data if there is any, otherwise nil
func (t *Type) Uncommon() *UncommonType {
	if t.TFlag&TFlagUncommon == 0 {
		return nil
	}
	switch t.Kind() {
	case Struct:
		return &(*structTypeUncommon)(unsafe.Pointer(t)).u
	case Pointer:
		type u struct {
			PtrType
			u UncommonType
		}
		return &(*u)(unsafe.Pointer(t)).u
	case Func:
		type u struct {
			FuncType
			u UncommonType
		}
		return &(*u)(unsafe.Pointer(t)).u
	case Slice:
		type u struct {
			SliceType
			u UncommonType
		}
		return &(*u)(unsafe.Pointer(t)).u
	case Array:
		type u struct {
			ArrayType
			u UncommonType
		}
		return &(*u)(unsafe.Pointer(t)).u
	case Chan:
		type u struct {
			ChanType
			u UncommonType
		}
		return &(*u)(unsafe.Pointer(t)).u
	case Map:
		type u struct {
			mapType
			u UncommonType
		}
		return &(*u)(unsafe.Pointer(t)).u
	case Interface:
		type u struct {
			InterfaceType
			u UncommonType
		}
		return &(*u)(unsafe.Pointer(t)).u
	default:
		type u struct {
			Type
			u UncommonType
		}
		return &(*u)(unsafe.Pointer(t)).u
	}
}

// Elem returns the element type for t if t is an array, channel, map, pointer, or slice, otherwise nil.
func (t *Type) Elem() *Type {
	switch t.Kind() {
	case Array:
		tt := (*ArrayType)(unsafe.Pointer(t))
		return tt.Elem
	case Chan:
		tt := (*ChanType)(unsafe.Pointer(t))
		return tt.Elem
	case Map:
		tt := (*mapType)(unsafe.Pointer(t))
		return tt.Elem
	case Pointer:
		tt := (*PtrType)(unsafe.Pointer(t))
		return tt.Elem
	case Slice:
		tt := (*SliceType)(unsafe.Pointer(t))
		return tt.Elem
	}
	return nil
}

// StructType returns t cast to a *StructType, or nil if its tag does not match.
func (t *Type) StructType() *StructType {
	if t.Kind() != Struct {
		return nil
	}
	return (*StructType)(unsafe.Pointer(t))
}

// MapType returns t cast to a *OldMapType or *SwissMapType, or nil if its tag does not match.
func (t *Type) MapType() *mapType {
	if t.Kind() != Map {
		return nil
	}
	return (*mapType)(unsafe.Pointer(t))
}

// ArrayType returns t cast to a *ArrayType, or nil if its tag does not match.
func (t *Type) ArrayType() *ArrayType {
	if t.Kind() != Array {
		return nil
	}
	return (*ArrayType)(unsafe.Pointer(t))
}

// FuncType returns t cast to a *FuncType, or nil if its tag does not match.
func (t *Type) FuncType() *FuncType {
	if t.Kind() != Func {
		return nil
	}
	return (*FuncType)(unsafe.Pointer(t))
}

// InterfaceType returns t cast to a *InterfaceType, or nil if its tag does not match.
func (t *Type) InterfaceType() *InterfaceType {
	if t.Kind() != Interface {
		return nil
	}
	return (*InterfaceType)(unsafe.Pointer(t))
}

// Size returns the size of data with type t.
func (t *Type) Size() uintptr { return t.Size_ }

// Align returns the alignment of data with type t.
func (t *Type) Align() int { return int(t.Align_) }

func (t *Type) FieldAlign() int { return int(t.FieldAlign_) }

type InterfaceType struct {
	Type
	PkgPath Name      // import path
	Methods []Imethod // sorted by hash
}

func (t *Type) ExportedMethods() []Method {
	ut := t.Uncommon()
	if ut == nil {
		return nil
	}
	return ut.ExportedMethods()
}

func (t *Type) NumMethod() int {
	if t.Kind() == Interface {
		tt := (*InterfaceType)(unsafe.Pointer(t))
		return tt.NumMethod()
	}
	return len(t.ExportedMethods())
}

// NumMethod returns the number of interface methods in the type's method set.
func (t *InterfaceType) NumMethod() int { return len(t.Methods) }

func (t *Type) Key() *Type {
	if t.Kind() == Map {
		return (*mapType)(unsafe.Pointer(t)).Key
	}
	return nil
}
```

一些类型转换定义, 这里并没有 **mapType** 的定义, 因为现在有两种 map 实现  
一种传统的 slice+hash-chain, 另一种 State of the art 的 SwissTable, 是接下来需要去关注的内容(而我实际也是被 map 吸引到这里的)

```go
// FuncType represents a function type.
//
// A *Type for each in and out parameter is stored in an array that
// directly follows the funcType (and possibly its uncommonType). So
// a function type with one method, one input, and one output is:
//
//	struct {
//		funcType
//		uncommonType
//		[2]*rtype    // [0] is in, [1] is out
//	}
type FuncType struct {
	Type
	InCount  uint16
	OutCount uint16 // top bit is set if last input parameter is ...
}

func (t *FuncType) In(i int) *Type {
	return t.InSlice()[i]
}

func (t *FuncType) NumIn() int {
	return int(t.InCount)
}

func (t *FuncType) NumOut() int {
	return int(t.OutCount & (1<<15 - 1))
}

func (t *FuncType) Out(i int) *Type {
	return (t.OutSlice()[i])
}

func (t *FuncType) InSlice() []*Type {
	uadd := unsafe.Sizeof(*t)
	if t.TFlag&TFlagUncommon != 0 {
		uadd += unsafe.Sizeof(UncommonType{})
	}
	if t.InCount == 0 {
		return nil
	}
	return (*[1 << 16]*Type)(addChecked(unsafe.Pointer(t), uadd, "t.inCount > 0"))[:t.InCount:t.InCount]
}
func (t *FuncType) OutSlice() []*Type {
	outCount := uint16(t.NumOut())
	if outCount == 0 {
		return nil
	}
	uadd := unsafe.Sizeof(*t)
	if t.TFlag&TFlagUncommon != 0 {
		uadd += unsafe.Sizeof(UncommonType{})
	}
	return (*[1 << 17]*Type)(addChecked(unsafe.Pointer(t), uadd, "outCount > 0"))[t.InCount : t.InCount+outCount : t.InCount+outCount]
}

func (t *FuncType) IsVariadic() bool {
	return t.OutCount&(1<<15) != 0
}
```

函数的类型定义, 支持多个返回值和可变参数

```go
type PtrType struct {
	Type
	Elem *Type // pointer element (pointed at) type
}

// Name is an encoded type Name with optional extra data.
//
// The first byte is a bit field containing:
//
//	1<<0 the name is exported
//	1<<1 tag data follows the name
//	1<<2 pkgPath nameOff follows the name and tag
//	1<<3 the name is of an embedded (a.k.a. anonymous) field
//
// Following that, there is a varint-encoded length of the name,
// followed by the name itself.
//
// If tag data is present, it also has a varint-encoded length
// followed by the tag itself.
//
// If the import path follows, then 4 bytes at the end of
// the data form a nameOff. The import path is only set for concrete
// methods that are defined in a different package than their type.
//
// If a name starts with "*", then the exported bit represents
// whether the pointed to type is exported.
//
// Note: this encoding must match here and in:
//   cmd/compile/internal/reflectdata/reflect.go
//   cmd/link/internal/ld/decodesym.go

type Name struct {
	Bytes *byte
}

// DataChecked does pointer arithmetic on n's Bytes, and that arithmetic is asserted to
// be safe for the reason in whySafe (which can appear in a backtrace, etc.)
func (n Name) DataChecked(off int, whySafe string) *byte {
	return (*byte)(addChecked(unsafe.Pointer(n.Bytes), uintptr(off), whySafe))
}

// Data does pointer arithmetic on n's Bytes, and that arithmetic is asserted to
// be safe because the runtime made the call (other packages use DataChecked)
func (n Name) Data(off int) *byte {
	return (*byte)(addChecked(unsafe.Pointer(n.Bytes), uintptr(off), "the runtime doesn't need to give you a reason"))
}

// IsExported returns "is n exported?"
func (n Name) IsExported() bool {
	return (*n.Bytes)&(1<<0) != 0
}

// HasTag returns true iff there is tag data following this name
func (n Name) HasTag() bool {
	return (*n.Bytes)&(1<<1) != 0
}

// IsEmbedded returns true iff n is embedded (an anonymous field).
func (n Name) IsEmbedded() bool {
	return (*n.Bytes)&(1<<3) != 0
}

// ReadVarint parses a varint as encoded by encoding/binary.
// It returns the number of encoded bytes and the encoded value.
func (n Name) ReadVarint(off int) (int, int) {
	v := 0
	for i := 0; ; i++ {
		x := *n.DataChecked(off+i, "read varint")
		v += int(x&0x7f) << (7 * i)
		if x&0x80 == 0 {
			return i + 1, v
		}
	}
}

// IsBlank indicates whether n is "_".
func (n Name) IsBlank() bool {
	if n.Bytes == nil {
		return false
	}
	_, l := n.ReadVarint(1)
	return l == 1 && *n.Data(2) == '_'
}

// writeVarint writes n to buf in varint form. Returns the
// number of bytes written. n must be nonnegative.
// Writes at most 10 bytes.
func writeVarint(buf []byte, n int) int {
	for i := 0; ; i++ {
		b := byte(n & 0x7f)
		n >>= 7
		if n == 0 {
			buf[i] = b
			return i + 1
		}
		buf[i] = b | 0x80
	}
}

// Name returns the tag string for n, or empty if there is none.
func (n Name) Name() string {
	if n.Bytes == nil {
		return ""
	}
	i, l := n.ReadVarint(1)
	return unsafe.String(n.DataChecked(1+i, "non-empty string"), l)
}

// Tag returns the tag string for n, or empty if there is none.
func (n Name) Tag() string {
	if !n.HasTag() {
		return ""
	}
	i, l := n.ReadVarint(1)
	i2, l2 := n.ReadVarint(1 + i + l)
	return unsafe.String(n.DataChecked(1+i+l+i2, "non-empty string"), l2)
}

func NewName(n, tag string, exported, embedded bool) Name {
	if len(n) >= 1<<29 {
		panic("abi.NewName: name too long: " + n[:1024] + "...")
	}
	if len(tag) >= 1<<29 {
		panic("abi.NewName: tag too long: " + tag[:1024] + "...")
	}
	var nameLen [10]byte
	var tagLen [10]byte
	nameLenLen := writeVarint(nameLen[:], len(n))
	tagLenLen := writeVarint(tagLen[:], len(tag))

	var bits byte
	l := 1 + nameLenLen + len(n)
	if exported {
		bits |= 1 << 0
	}
	if len(tag) > 0 {
		l += tagLenLen + len(tag)
		bits |= 1 << 1
	}
	if embedded {
		bits |= 1 << 3
	}

	b := make([]byte, l)
	b[0] = bits
	copy(b[1:], nameLen[:nameLenLen])
	copy(b[1+nameLenLen:], n)
	if len(tag) > 0 {
		tb := b[1+nameLenLen+len(n):]
		copy(tb, tagLen[:tagLenLen])
		copy(tb[tagLenLen:], tag)
	}

	return Name{Bytes: &b[0]}
}

const (
	TraceArgsLimit    = 10 // print no more than 10 args/components
	TraceArgsMaxDepth = 5  // no more than 5 layers of nesting

	// maxLen is a (conservative) upper bound of the byte stream length. For
	// each arg/component, it has no more than 2 bytes of data (size, offset),
	// and no more than one {, }, ... at each level (it cannot have both the
	// data and ... unless it is the last one, just be conservative). Plus 1
	// for _endSeq.
	TraceArgsMaxLen = (TraceArgsMaxDepth*3+2)*TraceArgsLimit + 1
)

// Populate the data.
// The data is a stream of bytes, which contains the offsets and sizes of the
// non-aggregate arguments or non-aggregate fields/elements of aggregate-typed
// arguments, along with special "operators". Specifically,
//   - for each non-aggregate arg/field/element, its offset from FP (1 byte) and
//     size (1 byte)
//   - special operators:
//   - 0xff - end of sequence
//   - 0xfe - print { (at the start of an aggregate-typed argument)
//   - 0xfd - print } (at the end of an aggregate-typed argument)
//   - 0xfc - print ... (more args/fields/elements)
//   - 0xfb - print _ (offset too large)
const (
	TraceArgsEndSeq         = 0xff
	TraceArgsStartAgg       = 0xfe
	TraceArgsEndAgg         = 0xfd
	TraceArgsDotdotdot      = 0xfc
	TraceArgsOffsetTooLarge = 0xfb
	TraceArgsSpecial        = 0xf0 // above this are operators, below this are ordinary offsets
)

// MaxPtrmaskBytes is the maximum length of a GC ptrmask bitmap,
// which holds 1-bit entries describing where pointers are in a given type.
// Above this length, the GC information is recorded as a GC program,
// which can express repetition compactly. In either form, the
// information is used by the runtime to initialize the heap bitmap,
// and for large types (like 128 or more words), they are roughly the
// same speed. GC programs are never much larger and often more
// compact. (If large arrays are involved, they can be arbitrarily
// more compact.)
//
// The cutoff must be large enough that any allocation large enough to
// use a GC program is large enough that it does not share heap bitmap
// bytes with any other objects, allowing the GC program execution to
// assume an aligned start and not use atomic operations. In the current
// runtime, this means all malloc size classes larger than the cutoff must
// be multiples of four words. On 32-bit systems that's 16 bytes, and
// all size classes >= 16 bytes are 16-byte aligned, so no real constraint.
// On 64-bit systems, that's 32 bytes, and 32-byte alignment is guaranteed
// for size classes >= 256 bytes. On a 64-bit system, 256 bytes allocated
// is 32 pointers, the bits for which fit in 4 bytes. So MaxPtrmaskBytes
// must be >= 4.
//
// We used to use 16 because the GC programs do have some constant overhead
// to get started, and processing 128 pointers seems to be enough to
// amortize that overhead well.
//
// To make sure that the runtime's chansend can call typeBitsBulkBarrier,
// we raised the limit to 2048, so that even 32-bit systems are guaranteed to
// use bitmaps for objects up to 64 kB in size.
const MaxPtrmaskBytes = 2048
```

**Name** 也有其类型超出了我的预料, 不过想想好像也合理

作为一个之前写 C/C++ 的程序员, 从类型中可以窥见其与 Golang 的巨大差别  
C++ 的运行时极小, 其理念是 Zero Overhead Abstraction  
Golang 在类型上可见为了支持类型映射(reflect), interface, GC ... 等一系列特性上, 做了多少事...
