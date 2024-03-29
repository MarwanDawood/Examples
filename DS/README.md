# Binary Trees

## Binary Search Tree
characteristics:
1. no duplicate node values.
2. the values in any left subtree are less than the value in its parent node.
3. the values in any right subtree are greater than the value in its parent node.

### pre-order traversal
The root is printed first.
The value in each node is processed as the node is visited.
Preorder traversal is used to create a copy of the tree.

### in-order traversal
The root is printed in the middle.
The inOrder traversal of a binary search tree prints the node values in _ascending order_.
The process of creating a _binary search tree_ actually sorts the data and thus this process is called the _binary tree sort_.
In-order traversal is used to retrives data of binary search tree in sorted order.

### post-order traversal
The root is printed last.
The value in each node is not printed until the values of its children are printed.
Postorder traversal is used to delete the tree.


---
# UML
## dependency
Dependency- A change in a class affects the change in it's dependent class. Example- Circle is dependent on Shape (an interface). If you change Shape, it affects Circle too. So, Circle has a dependency on Shape.

## association (composition, aggregation)
Association- means there is a certain relationship between 2 objects (one-one, one-many, many-many)

Association is of 2 types:
### 1.Composition - stronger Association or relationship between 2 objects.
You are creating an object of a class B inside another class A, If we delete class A , B won't exist (B object is created inside A only).

´public class A { B b;
                  public void setB(){
                                      this.b= new B(); }
                }´

Another example -Body & Liver .Liver can't exist outside Body.

### 2.Aggregation - weaker type of Association between 2 objects.
Even if you delete class A, B will exist outside (B is created outside and passed to Class A)
´public class A { B b;
                  public void setB(B b_ref){
                                             this.b= b_ref;  /* object B is passed as an argument of a method */ }
                }´

