#!/usr/bin/env python3
"""
深入分析WHO data.xlsx文件，查找PPE相关数据
"""

import pandas as pd

FILE_PATH = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/WHO data.xlsx'

def main():
    print("=== WHO数据PPE相关内容深入分析 ===\n")
    
    # 读取Data工作表
    print("正在读取Data工作表...")
    df = pd.read_excel(FILE_PATH, sheet_name='Data')
    
    print(f"总数据量: {len(df):,} 行\n")
    
    # 查看所有指标名称
    print("=== 所有指标名称（去重）===")
    indicators = df['indicator_name'].unique()
    print(f"共有 {len(indicators)} 个不同指标\n")
    
    # 查找PPE相关指标
    ppe_keywords = ['ppe', 'mask', 'respirator', 'glove', 'gown', 'protection', 
                    'surgical', 'medical', 'n95', 'ffp', 'kn95', 'shield',
                    'equipment', 'gear', 'apron', 'coverall']
    
    ppe_indicators = []
    for ind in indicators:
        ind_str = str(ind).lower()
        if any(kw in ind_str for kw in ppe_keywords):
            ppe_indicators.append(ind)
    
    if ppe_indicators:
        print(f"发现 {len(ppe_indicators)} 个PPE相关指标:")
        for ind in ppe_indicators:
            count = len(df[df['indicator_name'] == ind])
            print(f"  - {ind} ({count} 条记录)")
    else:
        print("未发现PPE相关指标")
    
    # 查看指标名称示例（前50个）
    print("\n=== 指标名称示例（前50个）===")
    for i, ind in enumerate(indicators[:50], 1):
        print(f"  {i}. {ind}")
    
    # 按setting（国家）统计
    print("\n=== 数据覆盖的国家/地区数量 ===")
    settings = df['setting'].unique()
    print(f"共有 {len(settings)} 个国家/地区")
    print(f"示例: {', '.join(settings[:10])}")
    
    # 按source（数据来源）统计
    print("\n=== 数据来源分布 ===")
    sources = df['source'].value_counts()
    print(sources.head(10))
    
    # 查看是否有COVID-19相关数据
    print("\n=== COVID-19相关数据搜索 ===")
    covid_keywords = ['covid', 'coronavirus', 'pandemic', '2020', '2021', '2022']
    covid_indicators = []
    for ind in indicators:
        ind_str = str(ind).lower()
        if any(kw in ind_str for kw in covid_keywords):
            covid_indicators.append(ind)
    
    if covid_indicators:
        print(f"发现 {len(covid_indicators)} 个COVID-19相关指标:")
        for ind in covid_indicators[:20]:
            print(f"  - {ind}")
    else:
        print("未发现COVID-19相关指标")
    
    # 按日期统计
    print("\n=== 数据时间范围 ===")
    dates = df['date'].dropna().unique()
    print(f"时间范围: {min(dates)} - {max(dates)}")
    
    print("\n\n分析完成!")

if __name__ == '__main__':
    main()
