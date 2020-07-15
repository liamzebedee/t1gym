import * as d3 from 'd3'
import { useEffect, useState } from "react"
import { Annotator } from "."
import DatabaseService from "../../misc/db_service"
import { usePromiseLoadingState } from '../../pages/helpers'

export const AnnotatorContainer = ({ data }) => {
    const [annotations, setAnnotations] = useState(null)

    async function _loadAnnotations() {
        let dateRange = d3
            .extent(data, function (d) { return d.date })
            .map(x => new Date(x))
        const db = await DatabaseService.get()
        const annotations = await db.annotations
            .where('startTime')
            .inAnyRange([dateRange])
            .toArray()
        setAnnotations(annotations)
    }

    async function onSaveAnnotation(annotation) {
        const db = await DatabaseService.get()
        await db.annotations.put(annotation)
    }

    const [load, loading] = usePromiseLoadingState(_loadAnnotations)

    useEffect(() => {
        load()
    }, [])
    
    return <>
        { loading && '' }
        { loading == false && <Annotator
            data={data}
            annotations={annotations}
            onSaveAnnotation={onSaveAnnotation}/>}
    </>
}

