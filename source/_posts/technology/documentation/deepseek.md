---
title: DeepSeek API 使用指南
date: 2026-05-10
categories: technology/documentation
tags:
    - deepseek
    - api
    - documentation
---

# 首次调用 Deepseek API


## 接入 Agent 工具

DeepSeek API 已接入多种主流 AI Agent 与编程助手工具。如果你使用 Claude Code、GitHub Copilot、OpenCode 等工具，可以直接将 DeepSeek 作为后端模型，无需编写代码即可开始使用。

详见 Agent 工具接入指南。
## 调用对话 API

在创建 API key 之后，你可以使用以下样例脚本，通过 OpenAI API 格式来访问 DeepSeek 模型。样例为非流式输出，您可以将 stream 设置为 true 来使用流式输出。

```python
# Please install OpenAI SDK first: `pip3 install openai`
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get('DEEPSEEK_API_KEY'),
    base_url="https://api.deepseek.com")

response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}}
)

print(response.choices[0].message.content)
```

| PARAM | VALUE |
| --- | --- |
| base_url (OpenAI) | https://api.deepseek.com |
| base_url (Anthropic) | https://api.deepseek.com/anthropic |
| api_key | apply for an API key |
| model* | deepseek-v4-flash |
| model* | deepseek-v4-pro |

| 控制项 | OpenAI 格式 | Anthropic 格式 |
| --- | --- | --- |
| 思考模式开关 |  `{"thinking": {"type": "enabled/disabled"}}`   |    `{"thinking": {"type": "enabled/disabled"}}`   |
| 思考强度控制 | `{"reasoning_effort": "high/max"}` | `{"output_config": {"effort": "high/max"}}` |

您在使用 OpenAI SDK 设置 thinking 参数时，需要将 thinking 参数传入 extra_body 中：

```python
response = client.chat.completions.create(
  model="deepseek-v4-pro",
  # ...
  reasoning_effort="high",
  extra_body={"thinking": {"type": "enabled"}}
)
```
### 多轮对话拼接
在每一轮对话过程中，模型会输出思维链内容（reasoning_content）和最终回答（content）。如果没有工具调用，则在下一轮对话中，之前轮输出的思维链内容不会被拼接到上下文中，如下图所示：

![alt text](https://api-docs.deepseek.com/zh-cn/img/deepseek_r1_multiround_example_cn.jpeg)

下面的代码以 Python 语言为例，展示了如何访问思维链和最终回答，以及如何在多轮对话中进行上下文拼接。
```python

from openai import OpenAI
client = OpenAI(api_key="<DeepSeek API Key>", base_url="https://api.deepseek.com")

# Turn 1
messages = [{"role": "user", "content": "9.11 and 9.8, which is greater?"}]
response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=messages,
    stream=True,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}},
)

reasoning_content = ""
content = ""

for chunk in response:
    if chunk.choices[0].delta.reasoning_content:
        reasoning_content += chunk.choices[0].delta.reasoning_content
    else:
        content += chunk.choices[0].delta.content

# Turn 2
# The reasoning_content will be ignored by the API
messages.append({"role": "assistant", "reasoning_content": reasoning_content, "content": content})

messages.append({'role': 'user', 'content': "How many Rs are there in the word 'strawberry'?"})
response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=messages,
    stream=True,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}},
)
```
