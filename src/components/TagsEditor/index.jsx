import { Editable, EditableInput, EditablePreview, Stack, IconButton } from "@chakra-ui/core";
import { useState, useEffect } from "react";
import { Tag, TagIcon, TagLabel, TagCloseButton } from "@chakra-ui/core";

export function tagsToString(arr) {
    return arr.join(', ')
}

export function tagsStringToArr(str) {
    return str.split(',').map(x => x.trim())
}

export const TagsEditor = ({ value = [], onChange }) => {
    const [tags, setTags] = useState(value)

    useEffect(() => {
        onChange(tags)
    }, [tags])
    
    return <>
        <Editable 
            startWithEditView={0} 
            selectAllOnFocus={0}
            defaultValue={tagsToString(value)} 
            // onChange={x => {}}
            // value={}
            onSubmit={(text) => {
                if (text.length === 0) return setTags([])
                setTags(tagsStringToArr(text))
            }}>
            {props => {
                const { isEditing, onRequestEdit } = props
                if (isEditing) {
                    return <EditableInput />
                } else {
                    return <>
                        <Stack spacing={1} isInline>
                            {tags.length && tags.map(tag => <Tag
                                size={'sm'}
                                rounded="full"
                                variant="solid"
                                variantColor="cyan"
                            >
                                <TagLabel>{tag}</TagLabel>
                                {/* <TagCloseButton /> */}
                            </Tag>)}
                        </Stack>
                        <IconButton size="sm" icon="edit" onClick={onRequestEdit} />
                    </>
                }
            }}

        </Editable>
    </>
}