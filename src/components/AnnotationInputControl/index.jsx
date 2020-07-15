import { useState } from "react"
import { Stack, FormControl, FormLabel, Textarea, Button, Heading } from "@chakra-ui/core"
import DateTime from 'react-datetime'
import { TagsEditor } from '../TagsEditor'
import { useEffect } from "react"

function useEditKey() {
    const [editKey, setEditKey] = useState(0)
    const resetEditKey = () => setEditKey(editKey+1)
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

export const AnnotationInputControl = ({ startTime, endTime, onSave, onDiscard }) => {
    let [ editKey, resetEditKey ] = useEditKey()

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
            
            <Heading as="h3" size="md">
            New annotation
            </Heading>
            <Stack isInline>
                <FormControl>
                    <FormLabel htmlFor="start-time">Start time</FormLabel>
                    <DateTime name="start-time"
                        value={startTime} />
                </FormControl>

                <FormControl>
                    <FormLabel htmlFor="end-time">End time</FormLabel>
                    <DateTime name="end-time"
                        value={endTime} />
                </FormControl>
            </Stack>

            <FormControl>
                <FormLabel htmlFor="end-time">Event tags</FormLabel>
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