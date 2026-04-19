<template>
  <div ref="chartRef" class="pie-chart" :style="{ height: height + 'px' }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

interface PieData {
  name: string
  value: number
  color?: string
}

interface Props {
  data: PieData[]
  height?: number
  donut?: boolean
  showLegend?: boolean
  themeColor?: string
  roseType?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  donut: false,
  showLegend: true,
  themeColor: '#339999',
  roseType: false
})

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
  
  const resizeHandler = () => chart?.resize()
  window.addEventListener('resize', resizeHandler)
  
  onUnmounted(() => {
    window.removeEventListener('resize', resizeHandler)
    chart?.dispose()
  })
}

const updateChart = () => {
  if (!chart) return
  
  const colors = props.data.map((item, index) => 
    item.color || getColor(index)
  ).filter((color): color is string => color !== undefined)
  
  const option = {
    color: colors,
    legend: props.showLegend ? {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#606266' }
    } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: { color: '#333' }
    },
    series: [{
      type: 'pie',
      radius: props.donut ? ['40%', '70%'] : '70%',
      center: props.showLegend ? ['40%', '50%'] : ['50%', '50%'],
      roseType: props.roseType ? 'radius' : undefined,
      data: props.data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%'
      },
      labelLine: {
        show: true
      }
    }]
  }
  
  chart.setOption(option)
}

const getColor = (index: number) => {
  const colors = ['#339999', '#67C23A', '#409EFF', '#E6A23C', '#F56C6C', '#909399', '#8B5CF6', '#EC4899']
  return colors[index % colors.length]
}

onMounted(() => {
  nextTick(() => initChart())
})

watch(() => props.data, () => {
  updateChart()
}, { deep: true })
</script>

<style scoped lang="scss">
.pie-chart {
  width: 100%;
}
</style>
