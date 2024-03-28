// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react"
import useBaseUrl from "@docusaurus/useBaseUrl"
import { useLocation } from "@docusaurus/router"
import useIsBrowser from "@docusaurus/useIsBrowser"
import { useActiveVersion, useVersions } from "@docusaurus/plugin-content-docs/client"
import { useColorMode, useDocsPreferredVersion } from "@docusaurus/theme-common"
import { usePluginData } from "@docusaurus/useGlobalData"
import { ungzip } from "pako"
import { SearchBox, presets } from "@orama/searchbox"
import { create, insertMultiple } from "@orama/orama"
import { pluginAnalytics } from "@orama/plugin-analytics"
import { OramaClient } from "@oramacloud/client"
import "@orama/searchbox/dist/index.css"

export function OramaSearch() {
  const [oramaInstance, setOramaInstance] = useState(null)
  const { pathname } = useLocation()

  const { searchData, endpoints, analytics, pluginContentDocsIds } = usePluginData("@orama/plugin-docusaurus-v3")
  const pluginId = pluginContentDocsIds.filter((id: string) => pathname.includes(id))[0] || pluginContentDocsIds[0]
  const baseURL = useBaseUrl("orama-search-index-@VERSION@.json.gz")
  const isBrowser = useIsBrowser()
  const activeVersion = useActiveVersion(pluginId)
  const versions = useVersions(pluginId)
  const { preferredVersion } = useDocsPreferredVersion(pluginId)
  const { colorMode } = useColorMode()

  const version = useMemo(() => {
    if (!isBrowser) {
      return undefined
    } else if (activeVersion) {
      return activeVersion
    } else if (preferredVersion) {
      return preferredVersion
    }

    return versions.find((v) => v.isLast) ?? versions[0]
  }, [isBrowser, activeVersion, preferredVersion, versions])

  useEffect(() => {
    async function loadOrama() {
      if (endpoints) {
        const { endpoint, api_key } = endpoints.find((endpoint: string) => endpoint.v === version.name)
        setOramaInstance(new OramaClient({
          api_key,
          endpoint
        }))
      } /*else {
        const client = await create({
          schema: presets.docs.schema,
          plugins: [
            pluginAnalytics({
              apiKey: analytics.apiKey,
              indexId: analytics.indexId,
              enabled: analytics.enabled
            })
          ]
        })
        let buffer

        if (searchData[version.name]) {
          buffer = searchData[version.name].data
        } else {
          const searchResponse = await fetch(baseURL.replace("@VERSION@", version.name))

          if (searchResponse.status === 0) {
            throw new Error(`Network error: ${await searchResponse.text()}`)
          } else if (searchResponse.status !== 200) {
            throw new Error(`HTTP error ${searchResponse.status}: ${await searchResponse.text()}`)
          }

          buffer = await searchResponse.arrayBuffer()
        }

        const deflated = ungzip(buffer, { to: "string" })

        console.log("===DEBUG===", deflated)

        await insertMultiple(client, JSON.parse(deflated))

        setOramaInstance(client)
      }*/
    }

    if (!isBrowser || !version) {
      return
    }

    loadOrama().catch((error) => {
      console.error("Cannot load search index.", error)
    })
  }, [isBrowser, searchData, baseURL, version])

  console.log("===DEBUG===", oramaInstance?.data)

  return (
    <div>
      {oramaInstance && <SearchBox oramaInstance={oramaInstance} colorScheme={colorMode} />}
    </div>
  )
}

export default function OramaSearchWrapper() {
  return <OramaSearch />
}
