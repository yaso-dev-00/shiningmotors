import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import React from 'react'
import { useRouter } from "next/navigation"

const Back = () => {
    const router=useRouter()
  return (
   <div className="flex items-center justify-between px-4 relative top-3">
            <div className="flex items-center space-x-2 gap-1">
              <Button variant="outline" size="icon" onClick={()=>router.back()} aria-label="Back">
                   <ArrowLeft className="h-4 w-4" />
              </Button>
             <p>back</p>
            </div>
          </div>
  )
}

export default Back