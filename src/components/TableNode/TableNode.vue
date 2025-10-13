<script setup lang="ts">
import { computed } from 'vue'
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
const { node } = defineProps<{
  node: TableNode
  indexKey: string | number
}>()

// 定义事件
defineEmits(['copy'])

// 计算列宽，平均分配。如果需要更复杂的策略，可以在此扩展
const colCount = computed(() => node?.header?.cells?.length ?? 0)
const colWidths = computed(() => {
  const n = colCount.value || 1
  const base = Math.floor(100 / n)
  // 为了保证总和为100%，最后一个列占剩余的百分比
  return Array.from({ length: n }).map((_, i) =>
    i === n - 1 ? `${100 - base * (n - 1)}%` : `${base}%`,
  )
})
</script>

<template>
  <table class="table-node table-fixed text-left my-8 text-sm w-full">
    <colgroup>
      <col v-for="(w, i) in colWidths" :key="`col-${i}`" :style="{ width: w }">
    </colgroup>
    <thead class="border-[var(--table-border,#cbd5e1)]">
      <tr class="border-b">
        <th
          v-for="(cell, index) in node.header.cells"
          :key="`header-${index}`"
          dir="auto"
          class="text-left font-semibold  dark:text-white truncate p-[calc(4/7*1em)]"
          :class="[index === 0 ? '!pl-0' : '']"
        >
          <NodeRenderer
            :nodes="cell.children"
            :index-key="`table-th-${indexKey}`"
            @copy="$emit('copy', $event)"
          />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(row, rowIndex) in node.rows"
        :key="`row-${rowIndex}`"
        class="border-[var(--table-border,#cbd5e1)]"
        :class="[
          rowIndex < node.rows.length - 1
            ? 'border-b'
            : '',
        ]"
      >
        <td
          v-for="(cell, cellIndex) in row.cells"
          :key="`cell-${rowIndex}-${cellIndex}`"
          class="text-left truncate p-[calc(4/7*1em)]"
          :class="[cellIndex === 0 ? '!pl-0' : '']"
          dir="auto"
        >
          <NodeRenderer
            :nodes="cell.children"
            :index-key="`table-td-${indexKey}`"
            @copy="$emit('copy', $event)"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.hr + .table-node{
  margin-top: 0;
}
</style>
