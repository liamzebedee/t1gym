import { useMemo, useState } from "react"
import { Stack, FormControl, FormLabel, Textarea, Button, Heading, Flex, Box } from "@chakra-ui/core"
import { TagsEditor } from '../TagsEditor'
import { useEffect } from "react"
import styles from './styles.module.css'
import { DateTime } from 'luxon'

function useEditKey() {
    const [editKey, setEditKey] = useState(0)
    const resetEditKey = () => setEditKey(editKey + 1)
    return [
        editKey,
        resetEditKey
    ]
}

/**
 * @typedef {Object} Annotation
 * @property {Date} startTime 
 * @property {Date} endTime 
 * @property {Array} tags 
 * @property {string} notes
 */

export const NewAnnotationControl = ({ startTime, endTime, onSave, onDiscard, stats }) => {
    let [editKey, resetEditKey] = useEditKey()

    useEffect(() => {
        resetEditKey()
    }, [startTime, endTime])

    const [notes, setNotes] = useState('')
    function handleInputChange(e) {
        let inputValue = e.target.value
        setNotes(inputValue)
    }

    const [tags, setTags] = useState([])
    function handleTagsChange(tags) {
        setTags(tags)
    }

    function onClickSave() {
        const data = {
            startTime,
            endTime,
            tags,
            notes
        }
        onSave(data)

        setNotes('')
        setTags([])
    }
    function onClickDiscard() {
        setNotes('')
        setTags([])
        onDiscard()
    }

    const startTimeDT = useMemo(() => 
        DateTime.fromJSDate(startTime).toFormat('t'), 
        [startTime]
    )
    const endTimeDT = useMemo(() => 
        DateTime.fromJSDate(endTime).toFormat('t'), 
        [endTime]
    )

    return <div>
        <Stack shouldWrapChildren>

            <Flex flexDirection="row">
                <span style={{ width: 150 }}><b>Start time</b><br/> {startTimeDT}</span>
                <span><b>BGL</b><br/> {(stats.startBG || 0).toFixed(1)}mmol</span>
            </Flex>

            <Flex flexDirection="row">
                <span style={{ width: 150 }}><b>End time</b><br/> {endTimeDT}</span>
                <span style={{ width: 150 }}><b>BGL</b><br/> {(stats.endBG || 0).toFixed(1)}mmol</span>
                <Box paddingRight="5"></Box>
                <span style={{ width: 150 }}><b>Δ BGL</b><br/> {(stats.deltaBG || 0) > 0 ? '+' : ''}{(stats.deltaBG || 0).toFixed(1)}mmol</span>
            </Flex>

            <Flex flexDirection="row">
                <span style={{ width: 149 }}>
                    <b>Total Carbs</b>: <span className={styles.carbs}>{(stats.totalCarbs || 0).toFixed(0)}g</span>
                </span>
                <Box paddingRight="5"></Box>
                <span style={{ width: 250 }}>
                    <b>Bolus/correction insulin</b>: <span className={styles.insulin}>{(stats.totalInsulin || 0).toFixed(1)}U</span>
                </span>
                <Box paddingRight="5"></Box>
                <span style={{ width: 200 }}>
                    <b>Basal insulin</b>: <span className={styles.insulin}>{(stats.totalBasalInsulin || 0).toFixed(1)}U</span>
                </span>
            </Flex>

            <FormControl>
                <FormLabel htmlFor="end-time">Tags</FormLabel>
                <TagsEditor onChange={handleTagsChange} key={editKey} />
            </FormControl>

            <FormControl>
                <FormLabel htmlFor="end-time">Notes</FormLabel>
                <Textarea onChange={handleInputChange} key={editKey}></Textarea>
            </FormControl>

            <Stack isInline>
                <Button size="sm" variantColor="green" onClick={onClickSave}>Save</Button>
                <Button size="sm" variantColor="gray" onClick={onClickDiscard}>Discard</Button>
            </Stack>
        </Stack>
    </div>
}