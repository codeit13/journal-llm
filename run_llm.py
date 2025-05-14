from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

tokenizer = AutoTokenizer.from_pretrained("thesleebit/journal-llm-v2")
model = AutoModelForCausalLM.from_pretrained(
    "thesleebit/journal-llm-v2",
    load_in_4bit=True,
    device_map="auto"
)
generator = pipeline("text-generation", model=model, tokenizer=tokenizer)

alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
Given a journal entry. Generate 5 follow-up questions for the user

### Input:
{}

### Response:
{}"""

prompt = alpaca_prompt.format(
        "Today I joined a new company. This is my first day here.", # input
        "", # output - leave this blank for generation!
    )
output = generator(prompt, max_new_tokens=128, return_full_text=False)

print(output[0]['generated_text'])