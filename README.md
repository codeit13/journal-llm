# 📔 Journal-LLM

[![Hugging Face](https://img.shields.io/badge/🤗_Hugging_Face-journal--llm--v2-yellow)](https://huggingface.co/thesleebit/journal-llm-v2)
[![Python](https://img.shields.io/badge/Python-3.12+-blue)](https://www.python.org/)

> A fine-tuned language model for journal-related tasks

## 🌟 Overview

Journal-LLM is a specialized language model fine-tuned on journal data. The model is trained on a custom dataset and optimized for journal-related text generation and analysis.

## 🔗 Resources

- **Model**: Access the fine-tuned model on [Hugging Face](https://huggingface.co/thesleebit/journal-llm-v2)
- **Training Notebook**: View the fine-tuning process in this [Google Colab Notebook](https://colab.research.google.com/drive/1NlqXAOOxmmBBQcWlKoC-XnXrmWXsYEXx?usp=sharing)

## 📊 Dataset

The model is trained on `dataset.jsonl`, which contains structured journal entries and related text.

## 📸 Results

### Model Testing Code

![Model Testing Code](images/model-run-code.png)
*Code snippet showing how to test the fine-tuned model*

### Before Fine-tuning

![Before Fine-tuning Results](images/before-finetune.png)
*Model output before the fine-tuning process*

### After Fine-tuning

![After Fine-tuning Results](images/after-finetune.png)
*Model output after fine-tuning, showing improved performance*

## 🚀 Quick Start

### Installation

```bash
uv venv journal --python 3.12
source journal/bin/activate
uv pip install -r requirements.txt
```

### Building the Dataset

```bash
uv run build_dataset.py
```

### Running the Model (GPU Required)
> It will pull the finetuned model from huggingface and run it using transformers using `AutoModelForCausalLM.from_pretrained`

```bash
uv run run_llm.py
```

## 🤔 Journal Analysis Tool

The Journal Analysis Tool is a new feature that helps users gain insights from their journal entries. It analyzes the text and generates thoughtful, open-ended questions to promote deeper reflection.

### Features

- **Mood Analysis**: Detects the emotional tone of your journal entry
- **Topic Identification**: Identifies key themes and topics discussed
- **Reflection Questions**: Generates 5 personalized, open-ended questions
- **Comprehensive Analysis**: Provides a detailed analysis of your writing

### Running the Journal Analyzer

```bash
python journal_analyzer.py test_journal_entry.txt
```

You can also specify a custom output file:

```bash
python journal_analyzer.py test_journal_entry.txt -o my_analysis.md
```

### Sample Output

The analyzer generates a Markdown file with sections for:

- Overview of your journal entry
- Mood analysis with emotional indicators
- Topics identified with importance ratings
- Reflection questions with context
- Summary with insights

## 📄 Other Tasks

Current UX issues and proposed solutions
- [Review Summariser for Ops Team](REVIEW_SUMMARISER.md) - Documentation for the review summarization feature
- [AI Feature Suggestion](AI_ROADMAP.md) - Future features and AI integration plans
- [User Experience Issues](User_Experience_Issues.md) -

---

<p align="center">Made with ❤️ by <a href="https://github.com/codeit13">Sumit Chauhan</a></p>