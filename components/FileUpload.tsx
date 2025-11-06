"use client"

import { toast } from "sonner"
import { X } from "lucide-react"
import Image from "next/image"
import { UploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { deleteImage } from "@/app/actions"

interface FileUploadProps {
  endpoint: "lessonImage" | "lessonVideo"
  value: string
  onChange: (file?: string) => void
  accept?: "image" | "video"
}

export default function FileUpload({ endpoint, value, onChange, accept = "image" }: FileUploadProps) {
  async function removeFile(url: string) {
    onChange("")
    await deleteImage(url)
    toast.success("Fichier supprimé")
  }

  return (
    <>
      {value ? (
        <div className="relative w-full flex flex-row gap-2">
          <div className="relative w-full max-w-md">
            {accept === "image" ? (
              <div className="relative h-48 w-full rounded-md overflow-hidden border">
                <Image
                  src={value}
                  fill
                  alt="Uploaded file"
                  className="object-cover"
                />
              </div>
            ) : (
              <video src={value} controls className="w-full rounded-md border" />
            )}
            <button
              onClick={() => removeFile(value)}
              className="bg-red-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm hover:bg-red-600 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <UploadDropzone<OurFileRouter, typeof endpoint>
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            if (res?.[0]) {
              onChange(res[0].url)
              toast.success("Fichier téléchargé avec succès", {
                icon: "👏",
              })
            }
          }}
          onUploadError={(err: Error) => {
            toast.error(`Erreur: ${err.message}`)
            console.error(err)
          }}
          appearance={{
            container:
              "w-full border border-dashed rounded-lg p-8 cursor-pointer hover:border-blue-500 transition-colors",
            uploadIcon: "w-10 h-10 mb-4 text-blue-500",
            label: "text-base text-black font-medium mb-2",
            allowedContent: "text-sm text-muted-foreground",
            button:
              "ut-ready:bg-blue-500 ut-uploading:cursor-not-allowed ut-uploading:bg-blue-400 bg-blue-500 hover:bg-blue-600 after:bg-blue-500 px-4 py-2 rounded-full",
          }}
          content={{
            label: accept === "image" 
              ? "Cliquez ou déposez une image ici" 
              : "Cliquez ou déposez une vidéo ici",
            allowedContent: accept === "image" 
              ? "Images jusqu'à 4MB" 
              : "Vidéos jusqu'à 32MB",
          }}
        />
      )}
    </>
  )
}

