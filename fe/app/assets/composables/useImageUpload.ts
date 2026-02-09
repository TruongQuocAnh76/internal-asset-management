export interface UploadProgress {
  index: number
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export const useImageUpload = () => {
  const uploadImages = async (
    files: File[],
    presignedUrls: string[]
  ): Promise<UploadProgress[]> => {
    if (files.length !== presignedUrls.length) {
      throw new Error('Files and presigned URLs count mismatch')
    }

    const progressArray: UploadProgress[] = files.map((_, index) => ({
      index,
      progress: 0,
      status: 'pending' as const,
    }))

    const uploadPromises = files.map(async (file, index) => {
      try {
        progressArray[index].status = 'uploading'

        await fetch(presignedUrls[index], {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        })

        progressArray[index].status = 'success'
        progressArray[index].progress = 100
      } catch (error: any) {
        progressArray[index].status = 'error'
        progressArray[index].error = error.message || 'Upload failed'
        throw error
      }
    })

    await Promise.all(uploadPromises)
    return progressArray
  }

  return {
    uploadImages,
  }
}
