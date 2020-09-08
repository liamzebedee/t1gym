import * as d3 from 'd3'
import { useEffect, useState } from "react"
import { Annotator } from "."
import { usePromiseLoadingState } from '../../pages/helpers'
import { annotationRepository } from '../../misc/annotation_repository'
import DatabaseService from '../../misc/db_service'

export const AnnotatorContainer = ({ treatments, data = [] }) => {
    const [annotations, setAnnotations] = useState(null)

    async function _loadAnnotations() {
        let dateRange = d3
            .extent(data, function (d) { return d.date })
            .map(x => new Date(x))
        const annotations = await annotationRepository.getAnnotations(dateRange)
        setAnnotations(annotations)
    }

    async function onSaveAnnotation(annotation) {
        await annotationRepository.saveAnnotation(annotation)
    }

    const [load, loading] = usePromiseLoadingState(_loadAnnotations)

    useEffect(() => {
        if(data.length) {
            load()
        }
    }, [data])
    
    return <>
        { loading && '' }
        { loading == false && <Annotator
            data={data}
            treatments={treatments}
            annotations={annotations}
            onSaveAnnotation={onSaveAnnotation}/>}
    </>
}

