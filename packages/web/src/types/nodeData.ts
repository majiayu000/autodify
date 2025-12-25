// 节点数据类型定义

export interface Variable {
  variable: string;
  label: string;
  type: 'text-input' | 'paragraph' | 'select' | 'number';
  required?: boolean;
  options?: string[];
  default?: string;
}

export interface Condition {
  variable: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'not_contains';
  value: string;
}

export interface NodeData {
  type: string;
  title: string;
  description?: string;
  // Start 节点
  variables?: Variable[];
  // LLM 节点
  model?: string;
  prompt_template?: string;
  temperature?: number;
  max_tokens?: number;
  // If-Else 节点
  conditions?: Condition[];
  // HTTP 节点
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  // Knowledge Retrieval 节点
  dataset_id?: string;
  top_k?: number;
  // Code 节点
  code?: string;
  language?: 'python' | 'javascript';
  // Template Transform 节点
  template?: string;
}
