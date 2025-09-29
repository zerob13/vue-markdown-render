<script setup lang="ts">
import NodeRenderer from '../NodeRenderer'

// 定义单元格节点
interface TableCellNode {
  type: 'table_cell'
  header: boolean
  children: {
    type: string
    raw: string
  }[]
  raw: string
}

// 定义行节点
interface TableRowNode {
  type: 'table_row'
  cells: TableCellNode[]
  raw: string
}

// 定义表格节点
interface TableNode {
  type: 'table'
  header: TableRowNode
  rows: TableRowNode[]
  raw: string
}

// 接收props
defineProps<{
  node: TableNode
}>()

// 定义事件
defineEmits(['copy'])
</script>

<template>
  <div
    class="overflow-x-auto max-w-full mb-4 shadow-sm border border-border rounded-lg"
  >
    <table class="border-collapse my-0 min-w-full table-fixed w-auto">
      <thead>
        <tr class="border-b">
          <th
            v-for="(cell, index) in node.header.cells"
            :key="`header-${index}`"
            dir="auto"
            class="p-2 text-left font-semibold bg-gray-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white whitespace-nowrap"
            :class="{
              'border-r ': index < node.header.cells.length - 1,
            }"
          >
            <NodeRenderer
              :nodes="cell.children"
              @copy="$emit('copy', $event)"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in node.rows"
          :key="`row-${rowIndex}`"
          :class="[
            rowIndex < node.rows.length - 1
              ? 'border-b dark:border-zinc-800'
              : '',
          ]"
        >
          <td
            v-for="(cell, cellIndex) in row.cells"
            :key="`cell-${rowIndex}-${cellIndex}`"
            class="p-2 text-left whitespace-nowrap"
            dir="auto"
            :class="{
              'border-r': cellIndex < row.cells.length - 1,
            }"
          >
            <NodeRenderer
              :nodes="cell.children"
              @copy="$emit('copy', $event)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
