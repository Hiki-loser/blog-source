---
title: 设计模式（一）
date: 2026-04-23 11:02:00
categories: technology/back-end
tags:
  - design patterns
description: 设计模式是软件开发中常用的解决方案，本文介绍了常见的设计模式及其应用场景，帮助开发者提高代码的可维护性和扩展性。
cover:
---

# 设计模式（一）
设计模式是软件开发中常用的解决方案，旨在解决特定问题并提高代码的可维护性和扩展性。设计模式分为三大类：创建型、结构型和行为型。本文将介绍一些常见的设计模式及其应用场景。
## 设计模式六大原则

1. **开闭原则（Open/Closed Principle）**：软件实体（类、模块、函数等）应该对扩展开放，对修改关闭。软件实体应该能通过添加新代码来扩展功能，而不是修改现有代码。**这是设计模式的核心原则。**
2. **单一职责原则（Single Responsibility Principle）**：一个类应该只有一个引起它变化的原因。一个类应该只有一个职责，避免一个类承担过多的责任导致修改一个职责时影响其他职责。
3. **里氏替换原则（Liskov Substitution Principle）**：子类对象应该能够替换父类对象而不影响程序的正确性。即子类不应该改变父类的行为，应该能够在任何使用父类的地方使用子类。
4. **接口隔离原则（Interface Segregation Principle）**：客户端不应该被迫依赖于它们不使用的接口。一个类对另一个类的依赖应该建立在最小的接口上，避免一个类依赖于它不需要的接口。
5. **依赖倒置原则（Dependency Inversion Principle）**：高层模块不应该依赖于低层模块，二者都应该依赖于抽象。抽象不应该依赖于细节，细节应该依赖于抽象。
6. **迪米特法则（Law of Demeter）**：一个对象应该对其他对象有尽可能少的了解。一个对象应该只与直接的朋友对象通信，而不应该与陌生对象通信。


## 创建型设计模式
创建型设计模式关注对象的创建过程，提供了一种灵活的方式来创建对象，避免了直接使用构造函数的复杂性。

### 单例模式（Singleton Pattern）
单例模式确保一个类只有一个实例，并提供一个全局访问点。适用于需要全局共享资源的场景，如数据库连接池、日志记录器等。
```java
public class Singleton {
    private static Singleton instance;

    private Singleton() {}

    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```
### 工厂模式（Factory Pattern）
工厂模式提供一个创建对象的接口，但由子类决定要实例化的类。适用于需要创建复杂对象的场景，如不同类型的图形对象、不同数据库连接等。
```java
public class ShapeFactory {
    public Shape createShape(String shapeType) {
        if ("Circle".equals(shapeType)) {
            return new Circle();
        } else if ("Square".equals(shapeType)) {
            return new Square();
        } else {
            throw new IllegalArgumentException("Unknown shape type");
        }
    }
}
```

### 原型模式（Prototype Pattern）
原型模式通过复制现有对象来创建新对象，避免了重复的对象创建过程。适用于需要大量创建相似对象的场景，如游戏中的敌人、文档编辑器中的文本样式等。

```java
public class Prototype implements Cloneable {
    @Override
    public Prototype clone() {
        try {
            return (Prototype) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException(e);
        }
    }
}
```
### 生成器模式（Builder Pattern）
生成器模式将一个复杂对象的构建过程分解成多个步骤，使得同样的构建过程可以创建不同的表示。适用于需要构建复杂对象的场景，如构建一个复杂的用户界面、构建一个复杂的文档等。
```java
public class ComputerBuilder {
    private Computer computer;

    public ComputerBuilder() {
        this.computer = new Computer();
    }

    public ComputerBuilder addCpu(String cpu) {
        this.computer.setCpu(cpu);
        return this;
    }

    public ComputerBuilder addRam(String ram) {
        this.computer.setRam(ram);
        return this;
    }

    public Computer build() {
        return this.computer;
    }
} 
```
## 结构型设计模式
结构型设计模式关注对象的组合和组织方式，提供了多种方式来组合对象以实现更复杂的功能。
### 适配器模式（Adapter Pattern）
适配器模式将一个类的接口转换成客户希望的另一个接口，使得原本由于接口不兼容而不能一起工作的类可以一起工作。适用于需要使用现有类但接口不兼容的场景，如将一个旧的日志记录器适配到新的日志记录器接口。
```java
public class Adapter implements Target {
    private Adaptee adaptee;

    public Adapter(Adaptee adaptee) {
        this.adaptee = adaptee;
    }

    @Override
    public void request() {
        adaptee.specificRequest();
    }
}
```
### 装饰器模式（Decorator Pattern）
装饰器模式动态地给一个对象添加一些额外的职责，就增加功能来说，装饰器模式比生成子类更为灵活。适用于需要在不修改现有对象的基础上添加功能的场景，如给一个文本框添加滚动条、给一个图形对象添加边框等。
```java
public interface Component {
    void operation();
}

public class Decorator implements Component {
    private Component component;

    public Decorator(Component component) {
        this.component = component;
    }

    @Override
    public void operation() {
        component.operation();
        // 添加额外的功能
    }
}
```
### 代理模式（Proxy Pattern）
代理模式为其他对象提供一种代理以控制对这个对象的访问。适用于需要控制对象访问的场景，如远程代理、虚拟代理、安全代理等。
```java
public class DynamicProxy implements InvocationHandler {
    private Object target;

    public DynamicProxy(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 在调用目标方法之前可以添加一些逻辑
        Object result = method.invoke(target, args);
        // 在调用目标方法之后可以添加一些逻辑
        return result;
    }
}
```
### 外观模式（Facade Pattern）
外观模式为子系统中的一组接口提供一个一致的界面，定义了一个高层接口，使得子系统更易使用。适用于需要简化复杂系统的场景，如提供一个统一的接口来访问多个子系统、简化一个复杂的库的使用等。
```java
public class Facade {
    private SubsystemA subsystemA;
    private SubsystemB subsystemB;

    public Facade() {
        this.subsystemA = new SubsystemA();
        this.subsystemB = new SubsystemB();
    }

    public void operation() {
        subsystemA.operationA();
        subsystemB.operationB();
    }
}
```
### 组合模式（Composite Pattern）
组合模式将对象组合成树形结构以表示“部分-整体”的层次结构。组合模式使得用户对单个对象和组合对象的使用具有一致性。适用于需要表示树形结构的场景，如文件系统、组织结构等。
```java
public interface Component {
    void operation();
}
public class Leaf implements Component {
    @Override
    public void operation() {
        // 叶子节点的操作
    }
}

public class Composite implements Component {
    private List<Component> children = new ArrayList<>();

    @Override
    public void operation() {
        for (Component child : children) {
            child.operation();
        }
    }

    public void add(Component component) {
        children.add(component);
    }

    public void remove(Component component) {
        children.remove(component);
    }
}
```
### 桥接模式（Bridge Pattern）
桥接模式将抽象部分与它的实现部分分离，使它们都可以独立地变化。适用于需要在抽象和实现之间进行解耦的场景，如在不同平台上实现同一功能、在不同数据库上实现同一数据访问等。
```java

public abstract class Abstraction {
    protected Implementor implementor;

    public Abstraction(Implementor implementor) {
        this.implementor = implementor;
    }

    public abstract void operation();
}

public class RefinedAbstraction extends Abstraction {
    public RefinedAbstraction(Implementor implementor) {
        super(implementor);
    }

    @Override
    public void operation() {
        implementor.operationImpl();
    }
}
public interface Implementor {
    void operationImpl();
}
public class ConcreteImplementorA implements Implementor {
    @Override
    public void operationImpl() {
        // 实现A的操作
    }
}
public class ConcreteImplementorB implements Implementor {
    @Override
    public void operationImpl() {
        // 实现B的操作
    }
}
```

### 享元模式（Flyweight Pattern）
享元模式通过共享对象来减少内存使用和提高性能。适用于需要大量创建相似对象的场景，如文本编辑器中的字符对象、游戏中的树对象等。
```java
public class Flyweight {
    private String intrinsicState;

    public Flyweight(String intrinsicState) {
        this.intrinsicState = intrinsicState;
    }

    public void operation(String extrinsicState) {
        // 使用内外状态进行操作
    }
}
```
## 行为型设计模式
行为型设计模式关注对象之间的交互和职责分配，提供了一种灵活的方式来定义对象之间的通信和协作。
### 观察者模式（Observer Pattern）
观察者模式定义了一种一对多的依赖关系，使得当一个对象的状态发生改变时，所有依赖于它的对象都会得到通知并自动更新。适用于需要实现事件驱动的场景，如发布-订阅系统、MVC架构中的视图更新等。
```java
public interface Observer {
    void update();
}
public class Subject {
    private List<Observer> observers = new ArrayList<>();

    public void attach(Observer observer) {
        observers.add(observer);
    }

    public void detach(Observer observer) {
        observers.remove(observer);
    }

    public void notifyObservers() {
        for (Observer observer : observers) {
            observer.update();
        }
    }
}
```
### 策略模式（Strategy Pattern）
策略模式定义了一系列算法，并将每个算法封装起来，使它们可以互换。适用于需要在运行时选择算法的场景，如排序算法、支付方式等。
```java
public interface Strategy {
    void execute();
}
public class ConcreteStrategyA implements Strategy {
    @Override
    public void execute() {
        // 实现A的算法
    }
}
public class ConcreteStrategyB implements Strategy {
    @Override
    public void execute() {
        // 实现B的算法
    }
}
public class Context {
    private Strategy strategy;
    public Context(Strategy strategy) {
        this.strategy = strategy;
    }
    public void setStrategy(Strategy strategy) {
        this.strategy = strategy;
    }
    public void executeStrategy() {
        strategy.execute();
    }
}
```
### 责任链模式（Chain of Responsibility Pattern）
责任链模式使多个对象都有机会处理请求，从而避免请求的发送者和接收者之间的耦合关系。将这些对象连成一条链，并沿着这条链传递请求，直到有一个对象处理它为止。适用于需要处理请求的场景，如日志记录器、事件处理等。
```java
public abstract class Handler {
    protected Handler successor;
    public void setSuccessor(Handler successor) {
        this.successor = successor;
    }
    public abstract void handleRequest();
}
public class ConcreteHandlerA extends Handler {
    @Override
    public void handleRequest() {
        if (/* 处理请求的条件 */) {
            // 处理请求
        } else if (successor != null) {
            successor.handleRequest();
        }
    }
}
public class ConcreteHandlerB extends Handler {
    @Override
    public void handleRequest() {
        if (/* 处理请求的条件 */) {
            // 处理请求
        } else if (successor != null) {
            successor.handleRequest();
        }
    }
}
```
### 命令模式（Command Pattern）
命令模式将一个请求封装为一个对象，从而使你可以用不同的请求对客户进行参数化。命令模式也支持可撤销的操作。适用于需要将请求封装为对象的场景，如菜单项、按钮操作等。
```java
public interface Command {
    void execute();
}
public class ConcreteCommand implements Command {
    private Receiver receiver;
    public ConcreteCommand(Receiver receiver) {
        this.receiver = receiver;
    }
    @Override
    public void execute() {
        receiver.action();
    }
}
public class Receiver {
    public void action() {
        // 执行具体操作
    }
}
public class Invoker {
    private Command command;
    public void setCommand(Command command) {
        this.command = command;
    }
    public void executeCommand() {
        command.execute();
    }
}
```
### 迭代器模式（Iterator Pattern）
迭代器模式提供一种方法顺序访问一个聚合对象中的各个元素，而又不暴露该对象的内部表示。适用于需要遍历集合对象的场景，如列表、树等。
```java
public interface Iterator {
    boolean hasNext();
    Object next();
}
public interface Aggregate {
    Iterator createIterator();
}
public class ConcreteAggregate implements Aggregate {
    private List<Object> items = new ArrayList<>();
    @Override
    public Iterator createIterator() {
        return new ConcreteIterator(items); 
    }
}
public class ConcreteIterator implements Iterator {
    private List<Object> items;
    private int position = 0;
    public ConcreteIterator(List<Object> items) {
        this.items = items;
    }
    @Override   
    public boolean hasNext() {
        return position < items.size();
    }   
    @Override
    public Object next() {
        if (hasNext()) {
            return items.get(position++);
        }
        throw new NoSuchElementException();
    }
}
```
### 中介者模式（Mediator Pattern）
中介者模式定义一个中介对象来封装一系列对象之间的交互。中介者使各对象不需要显示地相互引用，从而使其耦合松散，并且可以独立地改变它们之间的交互。适用于需要减少对象之间的直接依赖关系的场景，如聊天室中的用户交互、航空交通控制系统等。
```java
public class Mediator {
    private Colleague colleagueA;
    private Colleague colleagueB;

    public void setColleagueA(Colleague colleagueA) {
        this.colleagueA = colleagueA;
    }

    public void setColleagueB(Colleague colleagueB) {
        this.colleagueB = colleagueB;
    }

    public void send(String message, Colleague sender) {
        if (sender == colleagueA) {
            colleagueB.receive(message);
        } else if (sender == colleagueB) {
            colleagueA.receive(message);
        }
    }
}
public abstract class Colleague {
    protected Mediator mediator;
    public Colleague(Mediator mediator) {
        this.mediator = mediator;
    }
    public abstract void receive(String message);
}
public class ConcreteColleagueA extends Colleague {
    public ConcreteColleagueA(Mediator mediator) {
        super(mediator);
    }
    @Override
    public void receive(String message) {
        // 处理接收到的消息
    }
}
public class ConcreteColleagueB extends Colleague {
    public ConcreteColleagueB(Mediator mediator) {
        super(mediator);
    }
    @Override
    public void receive(String message) {
        // 处理接收到的消息
    }
}
```
### 备忘录模式（Memento Pattern）
备忘录模式在不破坏封装性的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态。这样以后就可以将该对象恢复到之前的状态。适用于需要保存对象状态的场景，如撤销操作、历史记录等。
```java
public class Memento {
    private String state;
    public Memento(String state) {
        this.state = state;
    }
    public String getState() {
        return state;
    }
}
public class Originator {
    private String state;
    public void setState(String state) {
        this.state = state;
    }
    public String getState() {
        return state;
    }
    public Memento saveStateToMemento() {
        return new Memento(state);
    }
    public void getStateFromMemento(Memento memento) {
        this.state = memento.getState();
    }
}
public class Caretaker {
    private Memento memento;
    public void setMemento(Memento memento) {
        this.memento = memento;
    }
    public Memento getMemento() {
        return memento;
    }
}   
```
### 解释器模式（Interpreter Pattern）
解释器模式给定一个语言，定义它的文法的一种表示，并定义一个解释器，该解释器使用该表示来解释语言中的句子。适用于需要解释语言的场景，如正则表达式、SQL解析器等。
```java
public interface Expression {
    boolean interpret(String context);
}
public class TerminalExpression implements Expression {
    private String data;
    public TerminalExpression(String data) {
        this.data = data;
    }
    @Override
    public boolean interpret(String context) {
        return context.contains(data);
    }
}
public class OrExpression implements Expression {   
    private Expression expr1;
    private Expression expr2;
    public OrExpression(Expression expr1, Expression expr2) {
        this.expr1 = expr1;
        this.expr2 = expr2;
    }
    @Override
    public boolean interpret(String context) {
        return expr1.interpret(context) || expr2.interpret(context);
    }
}
public class AndExpression implements Expression {
    private Expression expr1;
    private Expression expr2;
    public AndExpression(Expression expr1, Expression expr2) {
        this.expr1 = expr1;
        this.expr2 = expr2;
    }
    @Override
    public boolean interpret(String context) {
        return expr1.interpret(context) && expr2.interpret(context);
    }
}
```
设计模式是软件开发中非常重要的工具，能够帮助开发者解决常见的问题并提高代码的可维护性和扩展性。通过理解和应用设计模式，开发者可以编写出更清晰、更灵活、更易于维护的代码。在实际开发中，选择合适的设计模式并正确地应用它们是非常重要的，这需要开发者对设计模式有深入的理解和实践经验。希望本文对你理解设计模式有所帮助，并能够在你的开发工作中发挥作用。