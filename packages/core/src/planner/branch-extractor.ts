/**
 * Branch Extractor - Extract branch information from user requests
 */

/**
 * Branch information
 */
export interface BranchInfo {
  id: string;
  name: string;
  needsRetrieval: boolean;
  datasetId?: string;
  datasetName?: string;
}

/**
 * Extract branch information from user request
 */
export function extractBranches(userRequest: string): BranchInfo[] {
  const branches: BranchInfo[] = [];

  // Try to extract branch patterns from text
  // Pattern: "技术支持/技术问题" -> tech branch
  if (userRequest.includes('技术') || userRequest.includes('产品')) {
    branches.push({
      id: 'tech',
      name: '技术支持',
      needsRetrieval: userRequest.includes('知识') || userRequest.includes('检索') || userRequest.includes('文档'),
      datasetId: 'tech-docs',
      datasetName: '技术文档库',
    });
  }

  // Pattern: "账单/付款/退款" -> billing branch
  if (userRequest.includes('账单') || userRequest.includes('付款') || userRequest.includes('退款')) {
    branches.push({
      id: 'billing',
      name: '账单咨询',
      needsRetrieval: userRequest.includes('知识') || userRequest.includes('检索') || userRequest.includes('FAQ'),
      datasetId: 'billing-faq',
      datasetName: '账单FAQ库',
    });
  }

  // Pattern: "其他/一般" -> other branch
  if (userRequest.includes('其他') || userRequest.includes('一般') || branches.length > 0) {
    branches.push({
      id: 'other',
      name: '其他问题',
      needsRetrieval: false,
    });
  }

  // Default branches if none detected
  if (branches.length === 0) {
    branches.push(
      { id: 'category1', name: '类别一', needsRetrieval: true, datasetId: 'dataset-1' },
      { id: 'category2', name: '类别二', needsRetrieval: true, datasetId: 'dataset-2' },
      { id: 'default', name: '默认', needsRetrieval: false }
    );
  }

  return branches;
}
