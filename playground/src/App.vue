<script setup lang="ts">
import MarkdownRender from 'vue-renderer-markdown'

const content = `MarkdownRenderer initialized with content: # 股票数据分析Python代码示例

以下是一个简单的股票数据分析Python代码示例，使用\`yfinance\`库获取股票数据，并进行基本分析和可视化：

\`\`\`python
import yfinance as yf
import matplotlib.pyplot as plt
import pandas as pd

# 设置股票代码和时间范围
ticker = "AAPL"  # 苹果公司股票代码
start_date = "2023-01-01"
end_date = "2023-12-31"

# 获取股票数据
def get_stock_data(ticker, start_date, end_date):
    stock_data = yf.download(ticker, start=start_date, end=end_date)
    return stock_data

# 计算移动平均线
def calculate_moving_average(data, window=20):
    data[f'MA_{window}'] = data['Close'].rolling(window=window).mean()
    return data

# 绘制股票价格和移动平均线
def plot_stock_data(data, ticker):
    plt.figure(figsize=(12, 6))
    plt.plot(data['Close'], label='收盘价', color='blue')
    if 'MA_20' in data.columns:
        plt.plot(data['MA_20'], label='20日移动平均线', color='orange')
    plt.title(f'{ticker} 股票价格走势 ({start_date} 至 {end_date})')
    plt.xlabel('日期')
    plt.ylabel('价格 (美元)')
    plt.legend()
    plt.grid()
    plt.show()

# 计算基本统计信息
def calculate_statistics(data):
    stats = {
        '最高价': data['High'].max(),
        '最低价': data['Low'].min(),
        '平均收盘价': data['Close'].mean(),
        '年波动率': data['Close'].pct_change().std() * (252 ** 0.5)  # 年化波动率
    }
    return pd.Series(stats)

# 主程序
if __name__ == "__main__":
    # 获取数据
    stock_data = get_stock_data(ticker, start_date, end_date)
    
    # 计算移动平均线
    stock_data = calculate_moving_average(stock_data)
    
    # 显示前5行数据
    print("股票数据前5行:")
    print(stock_data.head())
    
    # 显示基本统计信息
    print("\n基本统计信息:")
    stats = calculate_statistics(stock_data)
    print(stats)
    
    # 绘制图表
    plot_stock_data(stock_data, ticker)
\`\`\`

## 代码说明

1. 使用\`yfinance\`库从Yahoo Finance获取股票数据
2. 计算20日移动平均线
3. 绘制股票收盘价和移动平均线图表
4. 计算并显示基本统计信息（最高价、最低价、平均收盘价和年化波动率）

## 运行要求

在运行此代码前，请确保已安装以下库：
\`\`\`
pip install yfinance matplotlib pandas
\`\`\`

## 扩展功能

你可以根据需要扩展此代码，添加以下功能：
- 添加更多技术指标（如RSI、MACD等）
- 实现简单的交易策略回测
- 添加多股票比较功能
- 连接券商API实现自动化交易

需要任何特定功能的实现或有其他问题，请随时告诉我！`
</script>

<template>
  <main>
    <MarkdownRender :content="content" />
    <Footer />
  </main>
</template>
