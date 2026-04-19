---
title: SQL 基础语法
date: 2026-04-18 21:23:00
categories: technology/database
tags:
  - database
  - SQL
description: SQL 语法入门与进阶，涵盖基本查询、数据操作、表结构修改、连接查询、分组与排序等内容。
cover:
---

# SQL 基础语法

## 什么是 SQL语句
SQL（Structured Query Language）是一种用于管理和操作关系型数据库的标准化编程语言。SQL 语句是用来执行各种数据库操作的命令，包括查询数据、插入数据、更新数据、删除数据以及管理数据库结构等。

## SQL 的基本语法

#### 1. SELECT 语句：用于从数据库中查询数据。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name;
```
#### 2. WHERE 子句：用于指定查询条件，过滤结果。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name
WHERE condition;
```
#### 3. INSERT INTO 语句：用于向数据库中插入新数据。基本语法如下：
```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);
```
#### 4. UPDATE 语句：用于更新数据库中的现有数据。基本语法如下：
```sql
UPDATE table_name
SET column1 = value1, column2 = value2, ...
WHERE condition;
```
#### 5. DELETE 语句：用于从数据库中删除数据。基本语法如下：
```sql
DELETE FROM table_name
WHERE condition;
```
#### 6. CREATE TABLE 语句：用于创建新的数据库表。基本语法如下：
```sql
CREATE TABLE table_name (
    column1 datatype,
    column2 datatype,
    ...
);
```
#### 7. ALTER TABLE 语句：用于修改现有的数据库表结构。基本语法如下：
```sql
ALTER TABLE table_name
ADD column_name datatype;
```
#### 8. DROP TABLE 语句：用于删除数据库表。基本语法如下：
```sql
DROP TABLE table_name;
```
## SQL进阶

#### 1. JOIN 语句：用于在查询中连接多个表。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table1 
JOIN table2 ON table1.common_column = table2.common_column;
```
- `on`：指定连接条件，通常是两个表中具有相同值的列。
- `join`：返回两个表中匹配的记录。
- `inner join`：返回两个表中匹配的记录。
- `left join`：返回左表中的所有记录，以及右表中匹配的记录，如果右表中没有匹配的记录，则返回 NULL。
- `right join`：返回右表中的所有记录，以及左表中匹配的记录，如果左表中没有匹配的记录，则返回 NULL。
- `full join`：返回两个表中的所有记录，如果某个表中没有匹配的记录，则返回 NULL。
- `cross join`：返回两个表的笛卡尔积，即每个表中的每条记录与另一个表中的每条记录组合。
- `self join`：将表与自身连接，通常用于查询层次结构数据。
- `natural join`：基于两个表中具有相同名称的列进行连接，自动匹配这些列。
- `full outer join`：返回两个表中的所有记录，如果某个表中没有匹配的记录，则返回 NULL。

#### 2. GROUP BY 语句：用于将查询结果按指定列进行分组。基本语法如下：
```sql
SELECT column1, COUNT(*)
FROM table_name
GROUP BY column1;
```

#### 3. HAVING 语句：用于过滤分组后的结果。基本语法如下：
```sql
SELECT column1, COUNT(*)
FROM table_name
GROUP BY column1 
HAVING COUNT(*) > 1;
```

#### 4. ORDER BY 语句：用于对查询结果进行排序。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name
ORDER BY column1 ASC|DESC;
```
- `ASC`：表示升序排序，默认值。
- `DESC`：表示降序排序。

#### 5. 子查询：在一个查询中嵌套另一个查询。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name
WHERE column1 IN (SELECT column1 FROM another_table WHERE condition);
``` 
#### 6. LIMIT 语句：用于限制查询结果的数量。基本语法如下：
```sql
SELECT column1, column2, ...
FROM table_name
LIMIT number;
```
#### 7. 常用关键字：
- `DISTINCT`：用于返回唯一不同的值。
- `AS`：用于给列或表起别名。
- `NULL`：表示缺失或未知的值。
- `LIKE`：用于在 WHERE 子句中进行模糊匹配。
- `IN`：用于在 WHERE 子句中指定多个值。
- `BETWEEN`：用于在 WHERE 子句中指定一个范围。
- `AND`、`OR`：用于在 WHERE 子句中组合多个条件。
- `IS NULL`、`IS NOT NULL`：用于检查列是否为 NULL。
- `UNION`：用于合并两个或多个 SELECT 语句的结果集。
- `EXISTS`：用于检查子查询是否返回结果。
- `CASE`：用于在查询中实现条件逻辑。
- `CAST`：用于将一种数据类型转换为另一种数据类型。
- `COALESCE`：用于返回第一个非 NULL 的值。
- `IF`：用于在查询中实现条件逻辑。
- `NULLIF`：用于比较两个表达式，如果相等则返回 NULL，否则返回第一个表达式的值。
- `GROUP_CONCAT`：用于将分组后的值连接成一个字符串。
- `OFFSET`：用于指定查询结果的起始位置。
- `FETCH`：用于指定查询结果的行数。
- `WITH`：用于定义公共表表达式（CTE）。
- `REGEXP`：用于在 WHERE 子句中进行正则表达式匹配。

示例:
| 列名         | 数据类型     | 约束           | 说明           |
|------------|------------|---------------|----------------|
| id         | INT        | PRIMARY KEY   | 主键，自增      |
| name       | VARCHAR(50)| NOT NULL      | 姓名           |
| age        | INT        |               | 年龄           |
| department | VARCHAR(50)|               | 部门           |
| hire_date  | DATE       |               | 入职日期        |



假设有如下 `employees` 表数据：

| id | name   | age | department | hire_date  |
|----|--------|-----|------------|------------|
| 1  | 张三   | 28  | 技术部     | 2022-03-01 |
| 2  | 李四   | 32  | 技术部     | 2021-07-15 |
| 3  | 王五   | 25  | 市场部     | 2023-01-10 |
| 4  | 赵六   | 29  | 技术部     | 2020-11-20 |
| 5  | 孙七   | 31  | 市场部     | 2022-08-05 |
| 6  | 周八   | 27  | 技术部     | 2021-05-18 |
| 7  | 钱九   | 30  | 技术部     | 2023-02-28 |
| 8  | 吴十   | 26  | 市场部     | 2022-12-12 |
| 9  | 郑十一 | 33  | 技术部     | 2020-09-30 |
| 10 | 王十二 | 24  | 市场部     | 2023-03-15 |
| 11 | 冯十三 | 28  | 技术部     | 2021-10-22 |
| 12 | 陈十四 | 29  | 市场部     | 2022-06-17 |

示例 SQL：

```sql
SELECT department, COUNT(*) AS employee_count
FROM employees
GROUP BY department
HAVING COUNT(*) > 5
ORDER BY employee_count DESC
LIMIT 10;
```
执行上面的 SQL 查询后，结果如下：

| department | employee_count |
|------------|----------------|
| 技术部     | 7              |
| 市场部     | 5              |

说明:
- 该查询统计了每个部门的员工数量，并筛选出员工数量大于 5 的部门。
- 结果按员工数量降序排序，并限制返回前 10 条记录。

#### 8. 常用函数：
- `COUNT()`：用于计算行数。
- `SUM()`：用于计算数值列的总和。
- `AVG()`：用于计算数值列的平均值。
- `MIN()`：用于计算数值列的最小值。
- `MAX()`：用于计算数值列的最大值。
- `LENGTH()`：用于计算字符串的长度。
- `CONCAT()`：用于连接字符串。
- `SUBSTRING()`：用于提取字符串的一部分。