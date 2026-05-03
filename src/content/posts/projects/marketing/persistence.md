---
title: "基础层持久化数据"
published: 2025-08-02
description: "基础层持久化数据\r 架构\r     persistent\r         dao接口(用来对接app层resources包下mybatis查询xml文件,需要加上mapper注解)\r         po(数据库实体类)\r         redis(缓存)\r         repository..."
tags: ["项目", "营销系统", "DDD"]
category: "项目-营销系统"
draft: false
---

# 基础层持久化数据
## 架构
    - persistent
        - dao接口(用来对接app层resources包下mybatis查询xml文件,需要加上mapper注解)
        - po(数据库实体类)
        -  redis(缓存)
        -  repository(仓储类用于操作数据的查询和缓存,实现的domain层的IRepository接口)