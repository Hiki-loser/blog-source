---
title: Java 多线程编程（一）
date: 2026-04-19 21:33:00
categories: technology/java
tags:
  - java
  - multithreading
description: Java 多线程编程入门，介绍线程的基本概念、创建线程的方法以及线程的生命周期。
cover:
---
# Java 多线程编程（一）

## 什么是多线程
多线程是指在一个程序中同时运行多个线程的能力。每个线程可以独立执行任务，但它们共享同一个进程的资源。多线程可以提高程序的效率和响应能力，特别是在处理大量数据或需要同时执行多个任务时。  

## 线程的基本概念

#### 1. 线程（Thread）
线程是程序执行的最小单位。每个线程都有自己的执行路径，可以独立执行任务。线程可以共享进程的资源，如内存和文件。
#### 2. 进程（Process）
进程是程序运行的一个实例，每个进程都有自己的内存空间和系统资源。一个进程可以包含多个线程，这些线程共享进程的资源。
#### 3.线程安全
线程安全是指在多线程环境下，程序能够正确地处理共享资源，避免数据不一致和竞争条件。线程安全的程序可以在多个线程同时访问共享资源时保持正确的行为。
#### 4.为什么需要多线程
- 提高程序的效率：多线程可以同时执行多个任务，充分利用CPU资源。
- 提高程序的响应能力：多线程可以让程序在执行长时间任务时保持响应。
- 提高CPU利用率：多线程可以让CPU在等待I/O操作时执行其他任务。
- 异步处理：多线程可以让程序在等待某些操作完成时继续执行其他任务。
#### 5.并发编程三大原则
- 原子性：一个操作要么全部执行成功，要么全部执行失败，不会被其他线程打断。
- 可见性：一个线程对共享变量的修改对其他线程是可见的。
- 有序性：程序执行的顺序按照代码的顺序执行，不会被编译器或处理器<span class="hover-tip" data-tip="处理器重排序：JVM 可能会对没有依赖关系的指令进行重排以优化性能，但在并发场景下可能导致可见性与时序问题。比如在一个线程中先写一个共享变量再设置一个标志位，另一个线程先检查标志位再读取共享变量，如果发生重排序，可能导致另一个线程看到标志位已设置但共享变量未更新的
情况。 " tabindex="0">重排序</span>。

## 线程的创建与使用

#### 1.创建线程的四种方式

##### 1. 继承 Thread 类：创建一个新的类继承 Thread 类，并重写 run() 方法。
- start()：启动线程，调用 run() 方法执行线程任务。
- run()：线程执行的任务代码。
- sleep(long millis)：使当前线程休眠指定的时间。
- join()：等待线程执行完毕。
- getState()：获取线程的状态。
- interrupt()：中断线程。
- isAlive()：检查线程是否还在运行。
- setName(String name)：设置线程的名称。
- getName()：获取线程的名称。
```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread is running");
    }
}
class Main {
    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.start();
    }
}
```
##### 2. 实现 Runnable 接口：创建一个新的类实现 Runnable 接口，并实现 run() 方法。

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Thread is running");
    }
}
class Main {
    public static void main(String[] args) {
        Thread thread = new Thread(new MyRunnable());
        thread.start();
    }
}
```

##### 3. 使用 Callable 接口：创建一个新的类实现 Callable 接口，并实现 call() 方法。

```java
import java.util.concurrent.FutureTask;
import java.util.concurrent.Callable;
class MyCallable implements Callable<String> {
    @Override
    public String call() throws Exception {
        return "Thread is running";
    }
}
class Main {
    public static void main(String[] args) throws Exception {
        FutureTask<String> futureTask = new FutureTask<>(new MyCallable());
        Thread thread = new Thread(futureTask);
        thread.start();
        System.out.println(futureTask.get());
    }
}
```
##### 4. 使用jdk21虚拟线程：使用 Thread.startVirtualThread() 方法创建一个新的虚拟线程。

```java
class Main {
    public static void main(String[] args) {
        Thread.startVirtualThread(() -> {
            System.out.println("Virtual Thread is running");
        });
    }
}
```

#### 2.线程的生命周期
线程的生命周期包括以下几个状态：
- 新建（New）：线程被创建但尚未启动。
- 就绪（Runnable）：线程已经准备好运行，等待CPU调度。
- 运行（Running）：线程正在执行任务。
- 等待（Waiting）：线程等待某个条件或事件发生。
- 阻塞（Blocked）：线程等待某个资源或条件满足。
- 死亡（Terminated）：线程执行完毕或被强制终止。
```java
import java.lang.Thread;
public class ThreadStates {
   public static void main(String[] args) throws Exception {
       Thread thread = new Thread(() -> {
           try {
               Thread.sleep(2000); // TIMED_WAITING
               synchronized (ThreadStates.class) {
                   ThreadStates.class.wait(); // WAITING
               }
           } catch (InterruptedException e) {
                e.printStackTrace();
           }
       });
       
       System.out.println("新建状态: " + thread.getState()); // NEW
       
        thread.start();
       System.out.println("启动后状态: " + thread.getState()); // RUNNABLE
       
       Thread.sleep(100);
       System.out.println("运行中状态: " + thread.getState()); // TIMED_WAITING
       
       Thread.sleep(3000);
       synchronized (ThreadStates.class) {
           ThreadStates.class.notify(); // 唤醒线程
       }
       
       Thread.sleep(100);
       System.out.println("最终状态: " + thread.getState()); // TERMINATED
   }
}
```
#### 3.线程同步与通信
线程同步是指多个线程访问共享资源时，确保资源的正确性和一致性。线程通信是指线程之间通过某种机制进行信息交换。
##### 1. 什么是锁及锁对象(Lock Object)

- 锁是用于控制对共享资源访问的机制。
- 锁对象是一个用于同步的对象，线程在访问共享资源时需要获取锁对象的锁。常见的锁对象有 synchronized 关键字、ReentrantLock 类等。当一个线程获取了锁对象的锁，其他线程就无法访问该资源，直到锁被释放。

```java
import java.util.concurrent.locks.ReentrantLock;
class Counter {
    private int count = 0;
    private final ReentrantLock lock = new ReentrantLock();
    public void increment() {   
        lock.lock(); // 获取锁
        try {
            count++; // 访问共享资源
        } finally {
            lock.unlock(); // 释放锁
        }
    }
    public int getCount() {
        return count;
    }
}
```

##### 2. synchronized 关键字：用于修饰方法或代码块，确保同一时间只有一个线程访问共享资源。
- 同步方法：当一个线程调用同步方法时，它会获取该方法所属对象的锁，其他线程无法访问该对象的任何同步方法，直到锁被释放。
- 同步静态方法：当一个线程调用同步静态方法时，它会获取该类的 Class 对象的锁，其他线程无法访问该类的任何同步静态方法，直到锁被释放。
- 同步代码块：可以在方法内部使用 synchronized 关键字创建一个同步代码块，指定一个锁对象来控制对共享资源的访问。

```java
class Counter {
    private int count = 0;
    public synchronized void increment() {
        count++; // 同步方法
    }
    public static synchronized void staticIncrement() {
        // 同步静态方法
    }
    public void methodWithSynchronizedBlock() {
        synchronized (this) {//使用当前对象作为锁
            // 同步代码块
        }
    }
    public int getCount() {
        return count;
    }
}
```

##### 3. volatile 关键字：用于修饰变量，确保变量的可见性和禁止指令重排序。
- 可见性：当一个线程修改了 volatile 变量的值，其他线程能够立即看到这个修改。volatile 变量的修改会被立即写入主内存，其他线程读取时会从主内存获取最新的值。
- 禁止指令重排序：volatile 变量的读写操作不会被编译器或处理器重排序，这保证了在多线程环境下的正确性.

```java
class SharedData {
    private volatile boolean flag = false;
    public void setFlag(boolean value) {
        flag = value; // 修改 flag 的值
    }
    public boolean getFlag() {
        return flag; // 读取 flag 的值
    }
}
```

##### 4. 线程通信：线程之间可以通过 wait()、notify() 和 notifyAll() 方法进行通信。这些方法必须在同步块或同步方法中使用。
- wait()：使当前线程进入等待状态，直到另一个线程调用 notify() 或 notifyAll() 方法唤醒它。
- notify()：唤醒一个正在等待的线程。唤醒的线程是随机选择的，如果有多个线程在等待，无法保证哪个线程会被唤醒。
- notifyAll()：唤醒所有正在等待的线程。

```java
class SharedResource {
    private boolean available = false;
    public synchronized void produce() throws InterruptedException {
        while (available) {
            wait(); // 等待资源不可用
        }
        // 生产资源
        available = true;
        notify(); // 通知消费者
    }
    public synchronized void consume() throws InterruptedException {
        while (!available) {
            wait(); // 等待资源可用
        }
        // 消费资源
        available = false;
        notify(); // 通知生产者
    }
}
```
#### 4.并发工具类
Java 提供了许多并发工具类来简化多线程编程，如 CountDownLatch、CyclicBarrier、Semaphore、Exchanger 等。这些工具类可以帮助我们更好地管理线程之间的协调和同步。
##### 1. CountDownLatch：一个同步辅助类，允许一个或多个线程等待直到在其他线程中执行的一组操作完成。
- CountDownLatch(int count)：创建一个 CountDownLatch 实例，指定计数器的初始值。
- void countDown()：使计数器减一，当计数器达到零时，所有等待的线程被唤醒。
- void await()：使当前线程等待，直到计数器达到零。
- long getCount()：返回当前计数器的值。
- boolean await(long timeout, TimeUnit unit)：使当前线程等待，直到计数器达到零或超时发生。
```java
import java.util.concurrent.CountDownLatch;
class Worker implements Runnable {
    private CountDownLatch latch;
    public Worker(CountDownLatch latch) {
        this.latch = latch;
    }
    @Override
    public void run() {
        try {
            // 执行任务
            Thread.sleep(1000);
            System.out.println("Worker finished");
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            latch.countDown(); // 任务完成，计数器减一
        }
    }
}
class Main {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(3);
        for (int i = 0; i < 3; i++) {
            new Thread(new Worker(latch)).start(); 
        }
        latch.await(); // 等待所有任务完成
        System.out.println("All workers finished");
    }
}
```
##### 2. CyclicBarrier：一个同步辅助类，允许一组线程互相等待，直到所有线程都达到某个公共屏障点。
- CyclicBarrier(int parties)：创建一个 CyclicBarrier 实例，指定参与线程的数量。
- CyclicBarrier(int parties, Runnable barrierAction)：创建一个 CyclicBarrier 实例，指定参与线程的数量和一个可选的屏障动作，当所有线程到达屏障点时执行。
- int await()：使当前线程等待，直到所有线程都到达屏障点。
- int await(long timeout, TimeUnit unit)：使当前线程等待，直到所有线程都到达屏障点或超时发生。
```java
import java.util.concurrent.CyclicBarrier;
class Worker implements Runnable {
    private CyclicBarrier barrier;
    public Worker(CyclicBarrier barrier) {
        this.barrier = barrier;
    }
    @Override
    public void run() {
        try {
            // 执行任务
            Thread.sleep(1000);
            System.out.println("Worker finished");
            barrier.await(); // 等待其他线程到达屏障点
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
class Main {
    public static void main(String[] args) {    
        CyclicBarrier barrier = new CyclicBarrier(3, () -> {
            System.out.println("All workers finished");
        });
        for (int i = 0; i < 3; i++) {
            new Thread(new Worker(barrier)).start(); 
        }
    }
}
```
##### 3. Semaphore：一个计数信号量，控制同时访问某个资源的线程数量。
- Semaphore(int permits)：创建一个 Semaphore 实例，指定许可的数量。
- void acquire()：获取一个许可，如果没有可用的许可，则线程会被阻塞直到有许可可用。
- void release()：释放一个许可，增加可用的许可数量。
- int availablePermits()：返回当前可用的许可数量。 
- boolean tryAcquire()：尝试获取一个许可，如果有可用的许可则获取成功并返回 true，否则返回 false。
```java
import java.util.concurrent.Semaphore;
class Worker implements Runnable {
    private Semaphore semaphore;
    public Worker(Semaphore semaphore) {
        this.semaphore = semaphore;
    }
    @Override
    public void run() {
        try {
            semaphore.acquire(); // 获取许可
            // 执行任务
            Thread.sleep(1000);
            System.out.println("Worker finished"); 
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            semaphore.release(); // 释放许可
        }
    }
}
class Main {
    public static void main(String[] args) {
        Semaphore semaphore = new Semaphore(2); // 允许同时访问的线程数量为 2
        for (int i = 0; i < 5; i++) {
            new Thread(new Worker(semaphore)).start(); 
        }
    }
}
```
##### 4. Exchanger：一个用于线程之间交换数据的同步点。
- Exchanger<V>()：创建一个 Exchanger 实例，指定交换数据的类型。
- V exchange(V x)：交换数据，如果没有其他线程调用 exchange() 方法，则当前线程会被阻塞直到有另一个线程调用 exchange() 方法进行交换。
- V exchange(V x, long timeout, TimeUnit unit)：交换数据，如果没有其他线程调用 exchange() 方法，则当前线程会被阻塞直到有另一个线程调用 exchange() 方法进行交换或超时发生。
```java
import java.util.concurrent.Exchanger;
class Worker implements Runnable {
    private Exchanger<String> exchanger;
    public Worker(Exchanger<String> exchanger) {
        this.exchanger = exchanger;
    }
    @Override
    public void run() {
        try {
            String data = "Data from " + Thread.currentThread().getName();
            String exchangedData = exchanger.exchange(data); // 交换数据
            System.out.println(Thread.currentThread().getName() + " exchanged data: " + exchangedData);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
class Main {
    public static void main(String[] args) {
        Exchanger<String> exchanger = new Exchanger<>();
        new Thread(new Worker(exchanger)).start();
        new Thread(new Worker(exchanger)).start();
        new Thread(new Worker(exchanger)).start();
    }
}
```
#### 5.线程池：线程池是一种管理和复用线程的机制，可以提高线程的效率和性能。Java 提供了 Executor 框架来创建和管理线程池。

##### 1.线程池参数
- corePoolSize：线程池中核心线程的数量，即使线程处于空闲状态也不会被销毁。
- maximumPoolSize：线程池中最大线程的数量，当线程池中的线程数量达到 maximumPoolSize 时，新的线程将参考handler 参数指定的策略进行处理。
- keepAliveTime：当线程池中的线程数量超过 corePoolSize 时，空闲线程的存活时间，超过这个时间后，空闲线程会被销毁。
- unit：keepAliveTime 的时间单位，可以是 TimeUnit.SECONDS、TimeUnit.MINUTES 等。
- workQueue：用于保存等待执行的任务的队列，可以是 ArrayBlockingQueue、LinkedBlockingQueue 等。
- threadFactory：用于创建线程的工厂，可以自定义线程的属性，如线程名称、优先级等。
- handler：当线程池中的线程数量达到 maximumPoolSize 时，处理被拒绝的任务的策略.
```java
import java.util.concurrent.*;
class Main {
    public static void main(String[] args) {
        ExecutorService executor = new ThreadPoolExecutor(
            2, // corePoolSize
            4, // maximumPoolSize
            60, // keepAliveTime
            TimeUnit.SECONDS, // unit   
            new LinkedBlockingQueue<>(10), // workQueue
            Executors.defaultThreadFactory(), // threadFactory
            new ThreadPoolExecutor.AbortPolicy() // handler
        );
        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            executor.submit(() -> {
                System.out.println("Task " + taskId + " is running");
                try {   
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
        }
        executor.shutdown();
    }
}
```
##### 2.线程池的工作流程
1. 当一个任务被提交到线程池时，线程池首先检查当前线程池中的线程数量是否小于 corePoolSize，如果是，则创建一个新的线程来执行任务。
2. 如果当前线程池中的线程数量已经达到 corePoolSize，则将任务添加到 workQueue 中等待执行。
3. 如果 workQueue 已满且当前线程池中的线程数量小于 maximumPoolSize，则创建一个新的非核心线程来执行任务。
4. 如果当前线程池中的线程数量已经达到 maximumPoolSize 且 workQueue 已满，则根据 handler 参数指定的策略处理被拒绝的任务。
5. 当线程池中的线程空闲时间超过 keepAliveTime 时，非核心线程会被销毁，核心线程则<span class="hover-tip" data-tip="核心线程即使空闲也不会被销毁，除非线程池被关闭。这是为了避免频繁创建和销毁线程带来的性能开销和增强系统响应性。
" tabindex="0">不会被销毁</span>

##### 3.线程池拒绝策略
- AbortPolicy：默认的拒绝策略，直接抛出 RejectedExecutionException 异常。
- CallerRunsPolicy：调用线程执行被拒绝的任务。
- DiscardPolicy：直接丢弃被拒绝的任务，不抛出异常。
- DiscardOldestPolicy：丢弃 workQueue 中最旧的一个任务，然后尝试执行被拒绝的任务。

#### 6.线程安全的集合类
Java 提供了一些线程安全的集合类，如 Vector、Hashtable、ConcurrentHashMap、CopyOnWriteArrayList 等。这些集合类通过内部的同步机制来保证线程安全，可以在多线程环境下安全地使用。

- Vector：一个线程安全的动态数组，所有方法都使用 synchronized 关键字进行同步。
- Hashtable：一个线程安全的哈希表，所有方法都使用 synchronized 关键字进行同步。
- ConcurrentHashMap：一个线程安全的哈希表，使用分段锁机制来提高并发性能。
- CopyOnWriteArrayList：一个线程安全的动态数组，使用复制机制来实现线程安全，适用于读多写少的场景。
```java
import java.util.concurrent.ConcurrentHashMap;
class Main {
    public static void main(String[] args) {
        ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
        Thread writer = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                map.put("key" + i, "value" + i);
                System.out.println("Writer added: key" + i);
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        Thread reader = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                String value = map.get("key" + i);
                System.out.println("Reader read: key" + i + " = " + value);
                try {
                    Thread.sleep(700);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        writer.start();
        reader.start();
    }
}
```
当不使用线程安全的集合类时，可能会出现数据不一致和竞争条件的问题。例如，在多线程环境下使用 ArrayList 进行读写操作时，可能会导致 ConcurrentModificationException 异常或数据丢失。因此，在多线程环境下，建议使用线程安全的集合类来保证数据的正确性和一致性.

#### 7.虚拟线程

虚拟线程是 Java 21 引入的一种轻量级线程实现，旨在提高并发性能和资源利用率。虚拟线程通过使用<span class="hover-tip" data-tip="协作式调度是一种线程调度机制，线程在执行过程中主动让出 CPU资源，允许其他线程执行。这种机制依赖于线程的合作，线程需要在适当的时候调用 yield() 方法来让出 CPU资源，或者在执行 I/O 操作时自动让出 CPU资源。协作式调度可以减少线程切换的开销，提高系统的性能和响应能力，但也可能导致线程饥饿和死锁等问题。" tabindex="0">协作式调度</span>和<span class="hover-tip" data-tip="非阻塞I/O指的是虚拟线程在执行I/O操作时不会阻塞线程，而是将线程挂起，等待I/O操作完成后再恢复线程的执行。这种机制允许虚拟线程在等待I/O操作时释放CPU资源，使其他线程能够继续执行，从而提高并发性能和响应能力。" tabindex="0">非阻塞I/O</span>来实现高效的并发执行。虚拟线程的创建和管理比传统线程更轻量级，可以在同一时间运行数百万个虚拟线程，而不会导致系统资源的过度消耗。虚拟线程适用于处理大量I/O密集型任务和高并发场景，可以显著提高程序的性能和响应能力。
```java
class Main {
    public static void main(String[] args) {
        Thread.startVirtualThread(() -> {
            System.out.println("Virtual Thread is running");
        });
    }
}
```
虚拟线程注意事项：

- 虚拟线程不适用于 CPU 密集型任务，因为它们的调度机制是协作式的，可能会导致 CPU 密集型任务占用过多的 CPU 资源，影响其他线程的执行。
- 虚拟线程不支持线程局部变量（ThreadLocal），因为它们的调度机制是协作式的，可能会导致线程局部变量的值不一致。
- 虚拟线程不支持线程优先级，因为它们的调度机制是协作式的，可能会导致线程优先级的设置无效。
- 虚拟线程不支持线程中断，因为它们的调度机制是协作式的，可能会导致线程中断的处理不及时。
- 虚拟线程不推荐线程池，因为虚拟线程的创建和管理比传统线程更轻量级，使用线程池可能会导致资源的过度消耗和性能下降.


#### 8.多线程常见问题及解决方法

1. 死锁：当两个或多个线程相互等待对方释放资源时，就会发生死锁，导致线程无法继续执行。
解决方法：避免嵌套锁、使用定时锁、使用死锁检测工具等。
2. 资源竞争：当多个线程同时访问共享资源时，可能会导致数据不一致和竞争条件的问题。
解决方法：使用线程同步机制，如 synchronized 关键字、Lock 接口等，来控制对共享资源的访问。
3. 线程饥饿：当某些线程长时间无法获取到所需的资源时，就会发生线程饥饿，导致这些线程无法继续执行。
解决方法：使用公平锁、调整线程优先级等，来确保所有线程都有机会获取到资源。
4. 线程泄漏：当线程被创建但未正确关闭时，就会发生线程泄漏，导致系统资源被耗尽。
解决方法：确保线程在完成任务后正确关闭，使用线程池来管理线程的生命周期等。
5. 线程安全问题：当多个线程同时访问共享资源时，可能会导致数据不一致和竞争条件的问题。
解决方法：使用线程安全的集合类、使用线程同步机制来控制对共享资源的访问等。