<script setup lang="ts">
import MarkdownRender from 'vue-renderer-markdown'

const content = `"# JavaScript 深度拷贝实现

在 JavaScript 中实现深度拷贝（神拷贝）需要考虑各种数据类型和特殊情况。下面我将为你提供一个完整的深度拷贝实现方案：

## 基础实现方案

这是一个支持常见数据类型的深度拷贝函数：

\`\`\`javascript
function deepClone(obj) {
  // 处理基本数据类型和 null/undefined
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const cloneArr = [];
    for (let i = 0; i < obj.length; i++) {
      cloneArr[i] = deepClone(obj[i]);
    }
    return cloneArr;
  }

  // 处理普通对象
  if (obj instanceof Object) {
    const cloneObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloneObj[key] = deepClone(obj[key]);
      }
    }
    return cloneObj;
  }

  // 其他情况（如 Map、Set 等）可以在这里扩展
  throw new Error(\`Unable to clone object of type \${obj.constructor.name}\`);
}
\`\`\`

## 进阶实现方案

这是一个更全面的实现，支持更多数据类型：

\`\`\`javascript
function deepCloneAdvanced(obj, hash = new WeakMap()) {
  // 处理基本数据类型和 null/undefined
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 处理循环引用
  if (hash.has(obj)) {
    return hash.get(obj);
  }

  // 处理日期对象
  if (obj instanceof Date) {
    const copy = new Date(obj);
    hash.set(obj, copy);
    return copy;
  }

  // 处理正则表达式
  if (obj instanceof RegExp) {
    const copy = new RegExp(obj.source, obj.flags);
    hash.set(obj, copy);
    return copy;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const copy = [];
    hash.set(obj, copy);
    for (let i = 0; i < obj.length; i++) {
      copy[i] = deepCloneAdvanced(obj[i], hash);
    }
    return copy;
  }

  // 处理 Map
  if (obj instanceof Map) {
    const copy = new Map();
    hash.set(obj, copy);
    obj.forEach((value, key) => {
      copy.set(deepCloneAdvanced(key, hash), deepCloneAdvanced(value, hash));
    });
    return copy;
  }

  // 处理 Set
  if (obj instanceof Set) {
    const copy = new Set();
    hash.set(obj, copy);
    obj.forEach(value => {
      copy.add(deepCloneAdvanced(value, hash));
    });
    return copy;
  }

  // 处理普通对象
  if (obj instanceof Object) {
    const copy = Object.create(Object.getPrototypeOf(obj));
    hash.set(obj, copy);
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepCloneAdvanced(obj[key], hash);
      }
    }
    return copy;
  }

  // 其他情况
  throw new Error(\`Unable to clone object of type \${obj.constructor.name}\`);
}
\`\`\`

## 使用示例

\`\`\`javascript
const original = {
  name: 'John',
  age: 30,
  hobbies: ['reading', 'coding'],
  address: {
    city: 'New York',
    zip: '10001'
  },
  birthDate: new Date('1990-01-01'),
  regex: /test/g,
  friends: new Set(['Alice', 'Bob']),
  scores: new Map([['math', 90], ['english', 85]])
};

// 添加循环引用
original.self = original;

const cloned = deepCloneAdvanced(original);

console.log(cloned);
console.log(cloned === original); // false
console.log(cloned.self === cloned); // true
\`\`\`

## 注意事项

1. **循环引用**：进阶版本使用 WeakMap 处理循环引用问题
2. **原型链**：进阶版本保留了原始对象的原型链
3. **特殊对象**：进阶版本支持 Date、RegExp、Map、Set 等特殊对象
4. **性能考虑**：深度拷贝可能对性能有影响，特别是对于大型对象

## 替代方案

如果你不需要自定义的深度拷贝实现，也可以考虑以下方法：

1. \`JSON.parse(JSON.stringify(obj))\` - 简单但有限制（不能处理函数、循环引用、特殊对象等）
2. 使用第三方库如 lodash 的 \`_.cloneDeep()\`

希望这个实现能满足你的需求！如果你有特定的使用场景或需要支持更多数据类型，可以告诉我，我可以进一步调整实现方案。"`
</script>

<template>
  <main>
    <MarkdownRender :content="content" />
    <Footer />
  </main>
</template>
