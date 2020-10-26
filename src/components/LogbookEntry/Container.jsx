import * as d3 from 'd3'
import { useEffect, useState } from "react"
import { LogbookEntry } from "."
import { usePromiseLoadingState } from '../../pages/helpers'
import { annotationRepository } from '../../misc/annotation_repository'
import DatabaseService from '../../misc/db_service'

export const LogbookEntryContainer = ({ treatments, data = [], dateRange }) => {
    const [annotations, setAnnotations] = useState(null)

    async function _loadAnnotations() {
        const annotations = await annotationRepository.getAnnotations(dateRange)
        setAnnotations(annotations)
    }

    async function onSaveAnnotation(annotation) {
        await annotationRepository.saveAnnotation(annotation)
    }

    const [load, loading] = usePromiseLoadingState(_loadAnnotations)

    useEffect(() => {
        annotationRepository.getAnnotationsRealtime(dateRange)((docs) => {
            setAnnotations(docs)
        })
    }, [])
    
    useEffect(() => {
        if(data.length) {
            load()
        }
    }, [data])

    return <>
        { loading && '' }
        { loading == false && <LogbookEntry
            data={data}
            treatments={treatments}
            annotations={annotations}
            onSaveAnnotation={onSaveAnnotation}/>}
    </>
}

