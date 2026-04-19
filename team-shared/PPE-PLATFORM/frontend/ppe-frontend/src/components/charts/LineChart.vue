<template>
  <div ref="chartRef" class="line-chart" :style="{ height: height + 'px' }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

interface ChartData {
  xAxis: string[]
  series: {
    name: string
    data: number[]
    color?: string
  }[]
}

interface Props {
  data: ChartData
  height?: number
  smooth?: boolean
  showArea?: boolean
  showLegend?: boolean
  themeColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  smooth: true,
  showArea: false,
  showLegend: true,
  themeColor: '#339999'
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
  
  const series = props.data.series.map((s, index) => {
    const color = s.color || (index === 0 ? props.themeColor : getColor(index))
    return {
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: props.smooth,
      lineStyle: { color, width: 3 },
      itemStyle: { color },
      areaStyle: props.showArea ? {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' }
          ]
        }
      } : undefined
    }
  })
  
  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: props.showLegend ? '15%' : '10%',
      containLabel: true
    },
    legend: props.showLegend ? {
      data: props.data.series.map(s => s.name),
      top: 0,
      textStyle: { color: '#606266' }
    } : undefined,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.xAxis,
      axisLine: { lineStyle: { color: '#ddd' } },
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#eee' } },
      axisLabel: { color: '#666' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: { color: '#333' }
    },
    series
  }
  
  chart.setOption(option)
}

const getColor = (index: number) => {
  const colors = ['#339999', '#67C23A', '#409EFF', '#E6A23C', '#F56C6C', '#909399']
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
.line-chart {
  width: 100%;
}
</style>
