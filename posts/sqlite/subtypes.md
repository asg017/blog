---
title: An unofficial list of SQLite subtypes in the wild
created_at: 9999-12-31
skip: true
---

| Subtype value | Source                | Usage            |
| ------------- | --------------------- | ---------------- |
| 74 (`'J'`)    | SQLite JSON extension | JSON values      |
| 88 (`'X'`)    | `sqlite-xml`          | XML              |
| 112 (`'p'`)   |                       |                  |
| 221           | `sqlite-html`         | HTML elements    |
| 223           | `sqlite-vec`          | float32 vectors  |
| 224           | `sqlite-vec`          | binary vectors   |
| 225           | `sqlite-vec`          | integer8 vectors |

## JSON subtype

https://github.com/sqlite/sqlite/blob/b11daa50f9ea11c332bb5913a071c5a0fd6c9993/src/json.c#L268

```c
/* The "subtype" set for text JSON values passed through using
** sqlite3_result_subtype() and sqlite3_value_subtype().
*/
#define JSON_SUBTYPE  74    /* Ascii for "J" */
```

https://github.com/sqlite/sqlite/blob/b11daa50f9ea11c332bb5913a071c5a0fd6c9993/src/vdbemem.c#L971

```c
void sqlite3VdbeMemSetPointer(
  Mem *pMem,
  void *pPtr,
  const char *zPType,
  void (*xDestructor)(void*)
){
  assert( pMem->flags==MEM_Null );
  vdbeMemClear(pMem);
  pMem->u.zPType = zPType ? zPType : "";
  pMem->z = pPtr;
  pMem->flags = MEM_Null|MEM_Dyn|MEM_Subtype|MEM_Term;
  pMem->eSubtype = 'p';
  pMem->xDel = xDestructor ? xDestructor : sqlite3NoopDestructor;
}
```

https://github.com/asg017/sqlite-html/blob/d3b1d77f2a0c1383349babed26fb8a196beab445/elements.go#L18

```go
var HTML_SUBTYPE = 0xdd
```

https://github.com/asg017/sqlite-vec/blob/e5b0f4c0c5ee69aa5746b0c64ab881e1fc6d9d70/sqlite-vec.c#L88-L92

```c
enum VectorElementType {
  SQLITE_VEC_ELEMENT_TYPE_FLOAT32 = 223 + 0,
  SQLITE_VEC_ELEMENT_TYPE_BIT = 223 + 1,
  SQLITE_VEC_ELEMENT_TYPE_INT8 = 223 + 2,
};
```

https://github.com/asg017/sqlite-xml/blob/acb1894bcfed3c6f2abc54650c4fce5817c4b522/src/scalar.rs#L38

```rust
fn result_xml(context: *mut sqlite3_context, doc: &Document, node: &RoNode) -> Result<()> {
    api::result_text(context, doc.ronode_to_string(node).as_str())?;
    api::result_subtype(context, b'X');
    Ok(())
}
```
