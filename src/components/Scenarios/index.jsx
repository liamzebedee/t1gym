import { useState, useEffect } from "react"
import DatabaseService from "../../misc/db_service"
import { Chart } from "../Chart"
import {
  CircularProgress,
  TagLabel,
  Tag,
  Stack,
  Flex,
  Box,
  Heading,
} from "@chakra-ui/core"
import queryString from "query-string"
import { getStartOfDayForTime } from "../../pages/helpers"
import { convertData } from "../../pages/helpers"
import styles from "./styles.module.css"

const DEFAULT_TAGS = [
  "Exercise",
  "Drinking",
  "Missed bolus",
  "Lows",
  "Breakfast",
  "Question",
]

export const Scenarios = () => {
  let db
  let [tags, setTags] = useState([])

  async function loadTagCounts(tag) {
    db = await DatabaseService.get()
    const count = await db.annotations.where("tags").anyOf(tag).count()
    return { tag, count }
  }

  async function loadTags() {
    db = await DatabaseService.get()

    // TODO: we can't search all available tags.
    // TODO: so I have to create a set manually.
    const uniqueTags = new Set()
    const annotationRecords = await db.annotations.toArray()
    annotationRecords.map((annotation) => {
      annotation.tags.map((tag) => uniqueTags.add(tag))
    })

    // setTags(await Promise.all(DEFAULT_TAGS.map(loadTagCounts)))
    setTags(await Promise.all(Array.from(uniqueTags).map(loadTagCounts)))
  }

  useEffect(() => {
    loadTags()
  }, [])

  const [tagFilter, setTagFilter] = useState(null)
  function selectTag(tag) {
    setTagFilter(tag)
    searchScenarios(tag)
  }

  const [results, setResults] = useState(null)
  const [loadingSearchResults, setLoadingSearchResults] = useState(null)

  async function searchScenarios(tag) {
    setLoadingSearchResults(true)

    // Get annotations for tag.
    db = await DatabaseService.get()
    const annotations = await db.annotations
      .where("tags")
      .startsWithAnyOfIgnoreCase(tag)
      .distinct()
      .toArray()

    // Get charts for each annotation (from Nightscout).
    const datums = await Promise.all(
      annotations.map(async (annotation) => {
        const { startTime, endTime } = annotation
        const params = {
          startTime: startTime.toString(),
          endTime: endTime.toString(),
        }
        const res = await fetch(
          `/api/charts?${queryString.stringify(params)}`
        ).then((res) => res.json())
        return {
          annotation,
          data: res.data,
        }
      })
    )

    setResults(datums)
    setLoadingSearchResults(false)
  }

  return (
    <Box p={5} boxShadow="lg">
      <Flex>
        <Stack shouldWrapChildren={true} spacing={4} isInline mb={5}>
          {tags.map(({ tag, count }, i) => {
            const active = tagFilter === tag
            return (
              <Tag
                className={`${styles.scenarioTag} ${
                  active ? styles.active : ""
                }`}
                key={i}
                onClick={() => selectTag(tag)}
                variantColor="gray"
              >
                <TagLabel>
                  {tag} ({count})
                </TagLabel>
              </Tag>
            )
          })}
        </Stack>
      </Flex>

      {loadingSearchResults && (
        <p>
          <CircularProgress isIndeterminate size="sm" color="green" /> Searching
          for {tagFilter}...
        </p>
      )}

      {loadingSearchResults === false && (
        <>
          {_.sortBy(results, ["annotation.startTime"])
            .reverse()
            .map((result, i) => {
              const day = getStartOfDayForTime(result.annotation.startTime)

              return (
                <Box key={i} p={5}>
                  <Flex>
                    <Flex align="left" flex="1">
                      <Chart
                        data={convertData(result.data)}
                        dynamicExtent={true}
                      />
                    </Flex>

                    <Flex flex="1">
                      <Stack spacing={8}>
                        <Box p={5} shadow="sm" borderWidth="1px">
                          <Heading fontSize="xl">{day.toFormat("DDD")}</Heading>
                          Notes:{" "}
                          <p style={{ whiteSpace: "pre-wrap" }}>
                            {result.annotation.notes}
                          </p>
                        </Box>
                      </Stack>
                    </Flex>
                  </Flex>
                </Box>
              )
            })}
        </>
      )}
    </Box>
  )
}
