<template>
  <div ref="chartRef" class="radar-chart" :style="{ height: height + 'px' }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

interface RadarIndicator {
  name: string
  max: number
}

interface RadarSeries {
  name: string
  value: number[]
  color?: string
}

interface Props {
  indicators: RadarIndicator[]
  series: RadarSeries[]
  height?: number
  showLegend?: boolean
  themeColor?: string
  areaOpacity?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  showLegend: true,
  themeColor: '#339999',
  areaOpacity: 0.3
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
  
  const series = props.series.map((s, index) => {
    const color = s.color || (index === 0 ? props.themeColor : getColor(index))
    return {
      name: s.name,
      value: s.value,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      areaStyle: {
        color: color + Math.round(props.areaOpacity * 255).toString(16).padStart(2, '0')
      }
    }
  })
  
  const option = {
    color: props.series.map((s, index) => s.color || (index === 0 ? props.themeColor : getColor(index))).filter((color): color is string => color !== undefined),
    legend: props.showLegend ? {
      data: props.series.map(s => s.name),
      bottom: 0,
      textStyle: { color: '#606266' }
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: { color: '#333' }
    },
    radar: {
      indicator: props.indicators,
      center: ['50%', '45%'],
      radius: '65%',
      axisName: {
        color: '#666',
        fontSize: 12
      },
      splitArea: {
        areaStyle: {
          color: ['#f8f9fa', '#fff']
        }
      },
      axisLine: {
        lineStyle: { color: '#ddd' }
      },
      splitLine: {
        lineStyle: { color: '#ddd' }
      }
    },
    series: [{
      type: 'radar',
      data: series
    }]
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

watch([() => props.indicators, () => props.series], () => {
  updateChart()
}, { deep: true })
</script>

<style scoped lang="scss">
.radar-chart {
  width: 100%;
}
</style>
