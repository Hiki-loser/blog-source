---
title: SQL 基础入门
date: 2026-04-18 21:23:00
categories: technology/database
tags:
  - database
  - SQL
description: SQL 基础入门
cover:
---

# SQL 基础入门

## 什么是 SQL
SQL（Structured Query Language）是一种用于管理和操作关系型数据库的编程语言。它提供了一套标准的语法和命令，用于查询、插入、更新和删除数据库中的数据。SQL 使得用户能够以一种结构化的方式与数据库进行交互，执行各种数据操作和管理任务。


## SQL 的基本语法
1. SELECT 语句：用于从数据库中查询数据。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name
```
2. WHERE 子句：用于指定查询条件，过滤结果。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name
WHERE condition
```
3. INSERT INTO 语句：用于向数据库中插入新数据。基本语法如下：
```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...)
```
4. UPDATE 语句：用于更新数据库中的现有数据。基本语法如下：
```sql
UPDATE table_name
SET column1 = value1, column2 = value2, ...
WHERE condition
```
5. DELETE 语句：用于从数据库中删除数据。基本语法如下：
```sql
DELETE FROM table_name
WHERE condition
```
6. CREATE TABLE 语句：用于创建新的数据库表。基本语法如下：
```sql
CREATE TABLE table_name (
    column1 datatype,
    column2 datatype,
    ...
)
```
7. ALTER TABLE 语句：用于修改现有的数据库表结构。基本语法如下：
```sql
ALTER TABLE table_name
ADD column_name datatype
```
8. DROP TABLE 语句：用于删除数据库表。基本语法如下：
```sql
DROP TABLE table_name
```
## SQL进阶

1. JOIN 语句：用于在查询中连接多个表。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table1
JOIN table2 ON table1.common_column = table2.common_column
```
2. GROUP BY 语句：用于将查询结果按指定列进行分组。基本语法如下：
```sql
SELECT column1, COUNT(*)
FROM table_name
GROUP BY column1
```
3. HAVING 语句：用于过滤分组后的结果。基本语法如下：
```sql
SELECT column1, COUNT(*)
FROM table_name
GROUP BY column1 
HAVING COUNT(*) > 1
```
4. ORDER BY 语句：用于对查询结果进行排序。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name
ORDER BY column1 ASC|DESC
```
5. 子查询：在一个查询中嵌套另一个查询。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name
WHERE column1 IN (SELECT column1 FROM another_table WHERE condition)
``` 

