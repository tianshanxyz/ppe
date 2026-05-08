#!/usr/bin/env python3
"""
分析WHO data.xlsx文件，提取PPE相关数据
"""

import pandas as pd
import sys

FILE_PATH = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/WHO data.xlsx'

def main():
    print("=== WHO数据文件分析 ===\n")
    
    # 获取文件信息
    import os
    file_size = os.path.getsize(FILE_PATH)
    print(f"文件大小: {file_size / 1024 / 1024:.2f} MB\n")
    
    # 读取Excel文件的所有sheet名称
    print("正在读取工作表列表...")
    xl = pd.ExcelFile(FILE_PATH)
    sheet_names = xl.sheet_names
    
    print(f"\n=== 工作表列表 ({len(sheet_names)}个) ===")
    for i, name in enumerate(sheet_names, 1):
        print(f"  {i}. {name}")
    
    # 分析每个工作表
    print("\n=== 工作表详细分析 ===")
    
    ppe_keywords = ['ppe', 'mask', 'respirator', 'glove', 'gown', 'protection', 
                    'surgical', 'medical', 'n95', 'ffp', 'kn95']
    
    for sheet_name in sheet_names[:5]:  # 只分析前5个工作表
        print(f"\n--- 工作表: '{sheet_name}' ---")
        
        try:
            # 只读取前5行来分析结构
            df = pd.read_excel(FILE_PATH, sheet_name=sheet_name, nrows=5)
            
            rows = len(pd.read_excel(FILE_PATH, sheet_name=sheet_name, usecols=[0]))
            cols = len(df.columns)
            
            print(f"  行数: {rows}, 列数: {cols}")
            print(f"  表头（前10列）:")
            
            for i, col in enumerate(df.columns[:10], 1):
                print(f"    {i}. {col}")
            
            if cols > 10:
                print(f"    ... 还有 {cols - 10} 列")
            
            # 显示前3行数据
            print(f"  数据示例（前3行，前5列）:")
            for idx, row in df.head(3).iterrows():
                values = [str(v)[:30] for v in row.values[:5]]
                print(f"    行{idx+1}: {' | '.join(values)}")
            
            # 查找PPE相关列
            ppe_cols = []
            for col in df.columns:
                col_str = str(col).lower()
                if any(kw in col_str for kw in ppe_keywords):
                    ppe_cols.append(col)
            
            if ppe_cols:
                print(f"  发现PPE相关列:")
                for col in ppe_cols:
                    print(f"    - {col}")
                    
        except Exception as e:
            print(f"  错误: {e}")
    
    print("\n\n分析完成!")

if __name__ == '__main__':
    main()
