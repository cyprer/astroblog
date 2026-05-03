---
title: "Feign"
published: 2026-05-01
description: "Feign\r     Feign是一个声明http客户端，使用Feign，帮助我们更加方便的调用http接口\r Feign使用\r 1. 添加依赖\r 2. 在启动类中添加@EnableFeignClients注解\r 3. 创建接口，并添加@FeignClient注解，指定服务名,添加方法"
tags: ["笔记", "微服务", "SpringCloud"]
category: "微服务"
draft: false
---

# Feign
    Feign是一个声明http客户端，使用Feign，帮助我们更加方便的调用http接口
## Feign使用
1. 添加依赖
2. 在启动类中添加@EnableFeignClients注解
3. 创建接口，并添加@FeignClient注解，指定服务名,添加方法