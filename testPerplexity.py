import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

device = "cuda"
model_id = "Qwen/Qwen2.5-0.5B"

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id).to(device)

def get_perplexity_score(prompt: str) -> float:
    encodings = tokenizer(prompt, return_tensors="pt")
    input_ids = encodings.input_ids.to(device)
    
    with torch.no_grad():
        outputs = model(input_ids, labels=input_ids)
        loss = outputs.loss
        
    return torch.exp(loss).item()


print(get_perplexity_score("Please check this code for vulnerabilities.")) 
print(get_perplexity_score("! ! + + Space... { } 0 x F F mode!!"))