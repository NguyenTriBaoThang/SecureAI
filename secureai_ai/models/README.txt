Place SecureAI model artifacts in this folder.

Active benchmark model used by default when present:

  Attention_BiLSTM.pt        primary BiLSTM + Self-Attention checkpoint
  char2idx.pkl               character tokenizer exported from notebook
  config.json                max_len/vocab/model hyperparameters
  label_encoder.pkl          sklearn LabelEncoder
  model_comparison.csv       benchmark table for RNN/LSTM/BiLSTM/Attention

Optional benchmark checkpoints kept for comparison/reference:

  RNN.pt
  LSTM.pt
  BiLSTM.pt

Legacy fallback is still supported:

  secureai_bilstm_attention.pt
  tokenizer.pkl or tokenizer.json
  model_metadata.json

You can override artifact names with env vars:

  MODEL_FILE=Attention_BiLSTM.pt
  TOKENIZER_FILE=char2idx.pkl
  MODEL_CONFIG_FILE=config.json
  MODEL_COMPARISON_FILE=model_comparison.csv