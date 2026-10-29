---
title: "fork"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/75c1da9ae5874d71aa8b5423b9bfb02d"
---

```jsx
/*
 * struct upid is used to get the id of the struct pid, as it is
 * seen in particular namespace. Later the struct pid is found with
 * find_pid_ns() using the int nr and struct pid_namespace *ns.
 */

struct upid {
	int nr;
	struct pid_namespace *ns;
};
```

```jsx
struct pid *find_pid_ns(int nr, struct pid_namespace *ns)
{
	return idr_find(&ns->idr, nr);
}
```
