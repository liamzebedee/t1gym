import { useState } from "react"
import { Stack, FormControl, FormLabel, Textarea, Button, Heading, Flex, Box } from "@chakra-ui/core"
import DateTime from 'react-datetime'
import { TagsEditor } from '../TagsEditor'
import { useEffect } from "react"
import styles from './styles.module.css'

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

    return <div>
        <Stack shouldWrapChildren>

            <Flex flexDirection="row">
                <FormControl>
                    <FormLabel htmlFor="start-time">Start time</FormLabel>
                    <DateTime
                        inputProps={{ disabled: true }}
                        dateFormat={false}
                        name="start-time"
                        value={startTime} />
                </FormControl>
                <span><b>BGL</b><br/> {(stats.startBG || 0).toFixed(1)}mmol</span>
            </Flex>

            <Flex flexDirection="row">
                <FormControl>
                    <FormLabel htmlFor="end-time">End time</FormLabel>
                    <DateTime
                        inputProps={{ disabled: true }}
                        dateFormat={false}
                        name="end-time"
                        value={endTime} />
                </FormControl>

                <span style={{ width: 150 }}><b>BGL</b><br/> {(stats.endBG || 0).toFixed(1)}mmol</span>
                <Box paddingRight="5"></Box>
                <span style={{ width: 150 }}><b>Δ BGL</b><br/> {(stats.deltaBG || 0) > 0 ? '+' : ''}{(stats.deltaBG || 0).toFixed(1)}mmol</span>
            </Flex>

            <Flex flexDirection="row">
                <span style={{ width: 150 }}>
                    <b>Total Carbs</b>: <span className={styles.carbs}>{(stats.totalCarbs || 0).toFixed(0)}g</span>
                </span>
                <Box paddingRight="5"></Box>
                <span style={{ width: 150 }}>
                    <b>Total insulin</b>: <span className={styles.insulin}>{(stats.totalInsulin || 0).toFixed(1)}U</span>
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