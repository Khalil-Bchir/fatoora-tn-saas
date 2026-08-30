import { getInvoicesClient } from '@/features/invoices/services/invoice-service'

export interface UploadResponse {
  url: string
  fileName: string
  folder: string
}

export const storageService = {
  async uploadFile(
    file: File,
    folder: 'signatures' | 'stamps' | 'payment-proofs' | 'logos' | 'general' = 'general'
  ): Promise<UploadResponse> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const client = getInvoicesClient()
    const { data } = await client.post<{ data: UploadResponse }>('/api/v1/storage/upload', {
      data: base64,
      fileName: file.name,
      folder,
    })

    return data.data
  },
}
