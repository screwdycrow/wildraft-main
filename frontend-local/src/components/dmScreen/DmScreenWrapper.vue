<template>
<div class="dm-screen-wrapper">t
    <div 
      class="dm-screen-flow-container" 
      :class="{ 
        'dm-screen-flow-container--measuring': currentVttTool === 'measure',
        'dm-screen-flow-container--pinging': currentVttTool === 'ping'
      }"
      :style="canvasBackgroundStyle"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <VueFlow
        v-if="dmScreen"
        :key="`vueflow-${dmScreen.id}`"
        ref="vueFlowRef"
        :nodes="nodes"
        :edges="[]"
        :node-types="nodeTypes"
        :default-viewport="{ zoom: 1, x: 0, y: 0 }"
        :min-zoom="0.2"
        :max-zoom="4"
        :fit-view-on-init="false"
        :zoom-on-double-click="false"
        class="dm-screen-flow"
        @nodes-change="onNodesChange"
        @node-drag-start="onNodeDragStart"
        @node-drag="onNodeDrag"
        @node-drag-stop="onNodeDragStop"
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
        @pane-context-menu="handlePaneContextMenu"
        @node-context-menu="(event: any) => handleNodeContextMenu(event.event, event.node.id)"
      >
        <Controls />
        <MiniMap v-if="!isPortalMode" class="minimap-top-right" />
        
        <!-- VTT Grid Overlay - inside VueFlow transform context -->
        <GridNode
          v-if="gridOptions.showGrid"
          :grid-size="gridOptions.gridSize || 50"
          :grid-color="gridOptions.gridColor || '#ffffff'"
          :grid-opacity="gridOptions.gridOpacity || 0.6"
          :line-width="gridOptions.gridLineWidth || 1"
          :offset-x="gridOptions.offsetX || 0"
          :offset-y="gridOptions.offsetY || 0"
          :show-major-grid-lines="gridOptions.showMajorGridLines !== false"
          :major-grid-interval="gridOptions.majorGridInterval || 5"
          :major-grid-color="gridOptions.majorGridColor || '#ffffff'"
          :feet-per-square="gridOptions.feetPerSquare || 5"
          :show-scale-indicator="true"
        />
        
        <!-- Movement Distance Display (shown while dragging) -->
        <Panel v-if="isDragging && movementDistance && movementDistance.squares > 0" position="top-center" class="movement-display-panel">
          <div class="movement-display">
            <v-icon icon="mdi-run-fast" size="small" class="mr-2" />
            <span class="movement-feet">{{ movementDistance.feet }} ft</span>
            <span class="movement-squares">({{ movementDistance.squares }} sq)</span>
          </div>
        </Panel>
        
        
        <!-- Kitbashing Drawers - left side vertical -->
        <Panel v-if="!isPortalMode" position="top-left" class="kitbashing-panel">
          <KitbashingDrawers @add-file="handleAddFileFromDrawer" />
        </Panel>
        
        <!-- VTT Toolbar (top center) -->
        <Panel v-if="!isPortalMode" position="top-center" class="vtt-toolbar-panel">
          <VttToolbar
            ref="vttToolbarRef"
            :show-grid="gridOptions.showGrid !== false"
            :snap-to-grid="gridOptions.snapToGrid !== false"
            :feet-per-square="gridOptions.feetPerSquare || 5"
            :diagonal-rule="localDiagonalRule"
            @tool-change="handleVttToolChange"
            @toggle-grid="handleToggleGrid"
            @toggle-snap="handleToggleSnap"
            @diagonal-rule-change="handleDiagonalRuleChange"
          />
        </Panel>
        
        <!-- Unified Bottom Toolbar -->
        <Panel v-if="!isPortalMode" position="bottom-center" class="unified-bottom-panel">
          <div class="unified-toolbar">
            <!-- Left: Effects, Shapes & Terrain Panels -->
            <div class="toolbar-left">
              <EffectsPanel @add-effect="handleAddEffect" />
              <ShapesPanel @add-shape="handleAddShape" />
              <TerrainPanel @add-terrain="handleAddTerrain" />
            </div>
            
            <!-- Center: Main Actions (slot for toolbar from parent) -->
            <div class="toolbar-center">
              <slot name="toolbar-actions" />
            </div>
            
            <!-- Right: Layer Control -->
            <div class="toolbar-right">
              <LayerControl
                :dm-screen-id="dmScreen.id"
                :library-id="dmScreen.libraryId"
                :show-grid="gridOptions.showGrid !== false"
                @layer-select="handleLayerSelect"
                @toggle-grid="handleToggleGrid"
              />
            </div>
          </div>
        </Panel>
      </VueFlow>
      
      <!-- VTT Measurement Ruler (outside VueFlow for proper mouse capture) -->
      <MeasurementRuler
        ref="measurementRulerRef"
        :is-active="currentVttTool === 'measure'"
        :grid-size="gridOptions.gridSize || 50"
        :feet-per-square="gridOptions.feetPerSquare || 5"
        :diagonal-rule="localDiagonalRule"
        :show-path-squares="true"
        :send-to-portal="gridOptions.showMeasurementsOnPortal === true"
        @measurement-end="handleMeasurementEnd"
      />
      
      <!-- Movement Trail & Ping SVG Overlay (outside VueFlow for proper positioning) -->
      <svg 
        v-if="(showMovementTrail && dragStartPosition && dragCurrentPosition) || movementTrail || activePing || portalMeasurementLines.length > 0"
        class="movement-trail-svg"
      >
        <!-- Active drag trail (green) -->
        <g v-if="showMovementTrail && dragStartPosition && dragCurrentPosition">
          <!-- Trail glow -->
          <line
            :x1="toScreenX(dragStartPosition.x)"
            :y1="toScreenY(dragStartPosition.y)"
            :x2="toScreenX(dragCurrentPosition.x)"
            :y2="toScreenY(dragCurrentPosition.y)"
            stroke="rgba(34, 197, 94, 0.4)"
            stroke-width="16"
            stroke-linecap="round"
          />
          <!-- Main trail line -->
          <line
            :x1="toScreenX(dragStartPosition.x)"
            :y1="toScreenY(dragStartPosition.y)"
            :x2="toScreenX(dragCurrentPosition.x)"
            :y2="toScreenY(dragCurrentPosition.y)"
            stroke="#22c55e"
            stroke-width="4"
            stroke-linecap="round"
            stroke-dasharray="12,6"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="18" dur="0.5s" repeatCount="indefinite" />
          </line>
          <!-- Start point -->
          <circle
            :cx="toScreenX(dragStartPosition.x)"
            :cy="toScreenY(dragStartPosition.y)"
            r="10"
            fill="#22c55e"
            stroke="white"
            stroke-width="3"
          />
          <!-- Current position point -->
          <circle
            :cx="toScreenX(dragCurrentPosition.x)"
            :cy="toScreenY(dragCurrentPosition.y)"
            r="10"
            fill="#22c55e"
            stroke="white"
            stroke-width="3"
          />
          <!-- Distance label while dragging -->
          <g v-if="movementDistance && movementDistance.squares > 0" :transform="`translate(${(toScreenX(dragStartPosition.x) + toScreenX(dragCurrentPosition.x)) / 2}, ${(toScreenY(dragStartPosition.y) + toScreenY(dragCurrentPosition.y)) / 2 - 25})`">
            <rect
              x="-40"
              y="-14"
              width="80"
              height="28"
              rx="6"
              fill="rgba(34, 197, 94, 0.95)"
              stroke="white"
              stroke-width="2"
            />
            <text
              x="0"
              y="6"
              text-anchor="middle"
              fill="white"
              font-size="14"
              font-weight="bold"
              font-family="JetBrains Mono, monospace"
            >
              {{ movementDistance.feet }} ft
            </text>
          </g>
        </g>
        
        <!-- Persisted stacked trail (yellow segments - after drop) -->
        <g v-if="movementTrail && movementTrail.segments.length > 0 && !isDragging">
          <!-- Render each segment -->
          <g v-for="(segment, idx) in movementTrail.segments" :key="idx">
            <!-- Trail glow -->
            <line
              :x1="toScreenX(segment.startX)"
              :y1="toScreenY(segment.startY)"
              :x2="toScreenX(segment.endX)"
              :y2="toScreenY(segment.endY)"
              stroke="rgba(251, 191, 36, 0.3)"
              stroke-width="14"
              stroke-linecap="round"
            />
            <!-- Main trail line -->
            <line
              :x1="toScreenX(segment.startX)"
              :y1="toScreenY(segment.startY)"
              :x2="toScreenX(segment.endX)"
              :y2="toScreenY(segment.endY)"
              stroke="#fbbf24"
              stroke-width="3"
              stroke-linecap="round"
              stroke-dasharray="10,5"
            />
            <!-- Waypoint marker at start -->
            <circle
              :cx="toScreenX(segment.startX)"
              :cy="toScreenY(segment.startY)"
              r="8"
              fill="#fbbf24"
              stroke="white"
              stroke-width="2"
            />
            <!-- Segment number -->
            <g :transform="`translate(${toScreenX(segment.startX)}, ${toScreenY(segment.startY) - 16})`">
              <circle r="9" fill="rgba(0,0,0,0.8)" stroke="#fbbf24" stroke-width="1" />
              <text x="0" y="3" text-anchor="middle" fill="white" font-size="10" font-weight="bold">{{ idx + 1 }}</text>
            </g>
          </g>
          <!-- Final endpoint -->
          <circle
            v-if="movementTrail.segments.length > 0"
            :cx="toScreenX(movementTrail.segments[movementTrail.segments.length - 1].endX)"
            :cy="toScreenY(movementTrail.segments[movementTrail.segments.length - 1].endY)"
            r="10"
            fill="#fbbf24"
            stroke="white"
            stroke-width="3"
          />
          <!-- Total distance label near final point -->
          <g 
            v-if="movementTrail.totalDistance.feet > 0"
            :transform="`translate(${toScreenX(movementTrail.segments[movementTrail.segments.length - 1].endX) + 25}, ${toScreenY(movementTrail.segments[movementTrail.segments.length - 1].endY) - 25})`"
          >
            <rect
              x="-40"
              y="-14"
              width="80"
              height="28"
              rx="6"
              fill="rgba(34, 197, 94, 0.95)"
              stroke="white"
              stroke-width="2"
            />
            <text
              x="0"
              y="6"
              text-anchor="middle"
              fill="white"
              font-size="14"
              font-weight="bold"
              font-family="JetBrains Mono, monospace"
            >
              {{ movementTrail.totalDistance.feet }} ft
            </text>
          </g>
        </g>
        
        <!-- Ping indicator -->
        <g v-if="activePing" class="ping-indicator">
          <circle
            :cx="toScreenX(activePing.x)"
            :cy="toScreenY(activePing.y)"
            r="30"
            fill="none"
            stroke="#ef4444"
            stroke-width="4"
            class="ping-ring ping-ring-1"
          />
          <circle
            :cx="toScreenX(activePing.x)"
            :cy="toScreenY(activePing.y)"
            r="50"
            fill="none"
            stroke="#ef4444"
            stroke-width="3"
            class="ping-ring ping-ring-2"
          />
          <circle
            :cx="toScreenX(activePing.x)"
            :cy="toScreenY(activePing.y)"
            r="70"
            fill="none"
            stroke="#ef4444"
            stroke-width="2"
            class="ping-ring ping-ring-3"
          />
          <circle
            :cx="toScreenX(activePing.x)"
            :cy="toScreenY(activePing.y)"
            r="12"
            fill="#ef4444"
            stroke="white"
            stroke-width="3"
          />
        </g>
        
        <!-- Portal-received measurement lines (from DM ruler tool) -->
        <g v-if="portalMeasurementLines.length > 0 && isPortalMode" class="portal-measurements">
          <g v-for="(line, idx) in portalMeasurementLines" :key="line.id || idx">
            <!-- Line glow -->
            <line
              :x1="toScreenX(line.startX)"
              :y1="toScreenY(line.startY)"
              :x2="toScreenX(line.endX)"
              :y2="toScreenY(line.endY)"
              stroke="rgba(255, 212, 59, 0.3)"
              stroke-width="14"
              stroke-linecap="round"
            />
            <!-- Main line -->
            <line
              :x1="toScreenX(line.startX)"
              :y1="toScreenY(line.startY)"
              :x2="toScreenX(line.endX)"
              :y2="toScreenY(line.endY)"
              stroke="#fbbf24"
              stroke-width="3"
              stroke-linecap="round"
              stroke-dasharray="10,5"
            />
            <!-- Waypoints -->
            <circle
              :cx="toScreenX(line.startX)"
              :cy="toScreenY(line.startY)"
              r="8"
              fill="#fbbf24"
              stroke="white"
              stroke-width="2"
            />
          </g>
          <!-- Final waypoint -->
          <circle
            v-if="portalMeasurementLines.length > 0"
            :cx="toScreenX(portalMeasurementLines[portalMeasurementLines.length - 1].endX)"
            :cy="toScreenY(portalMeasurementLines[portalMeasurementLines.length - 1].endY)"
            r="8"
            fill="#fbbf24"
            stroke="white"
            stroke-width="2"
          />
          <!-- Total distance label -->
          <g 
            v-if="portalMeasurementTotal > 0"
            :transform="`translate(${toScreenX(portalMeasurementLines[portalMeasurementLines.length - 1].endX) + 30}, ${toScreenY(portalMeasurementLines[portalMeasurementLines.length - 1].endY) - 30})`"
          >
            <rect x="-45" y="-16" width="90" height="32" rx="8" fill="rgba(34, 197, 94, 0.95)" stroke="white" stroke-width="2" />
            <text x="0" y="6" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="JetBrains Mono, monospace">
              {{ portalMeasurementTotal }} ft
            </text>
          </g>
        </g>
      </svg>
    </div>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettingsDialog" max-width="550" scrollable :attach="false">
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-cog" class="mr-2" />
          DM Screen Settings
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <!-- VTT Grid Settings -->
          <div class="mb-6">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">
              <v-icon icon="mdi-grid" class="mr-2" size="small" />
              Grid (VTT)
            </h3>
            
            <v-switch
              v-model="localGridOptions.showGrid"
              label="Show Grid"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
            />
            
            <!-- Grid Size with scale info -->
            <div class="d-flex align-center gap-2 mb-3">
              <v-slider
                v-model.number="localGridOptions.gridSize"
                label="Grid Size"
                min="20"
                max="100"
                step="5"
                thumb-label
                hide-details
                class="flex-grow-1"
              />
              <v-text-field
                v-model.number="localGridOptions.gridSize"
                type="number"
                density="compact"
                hide-details
                style="max-width: 80px;"
                suffix="px"
              />
            </div>
            
            <!-- Feet per Square (D&D 5e scale) -->
            <div class="d-flex align-center gap-2 mb-3">
              <v-select
                v-model.number="localGridOptions.feetPerSquare"
                label="Scale (1 square =)"
                :items="[
                  { value: 5, title: '5 ft (Standard)' },
                  { value: 10, title: '10 ft (Large scale)' },
                  { value: 2.5, title: '2.5 ft (Half scale)' },
                ]"
                item-value="value"
                item-title="title"
                density="compact"
                hide-details
                class="flex-grow-1"
              />
            </div>
            
            <!-- Grid Color -->
            <div class="d-flex align-center gap-2 mb-3">
              <span class="text-body-2" style="min-width: 80px;">Grid Color</span>
              <input
                v-model="localGridOptions.gridColor"
                type="color"
                class="color-picker"
              />
              <v-text-field
                v-model="localGridOptions.gridColor"
                density="compact"
                hide-details
                style="max-width: 100px;"
              />
            </div>
            
            <!-- Grid Opacity -->
            <div class="d-flex align-center gap-2 mb-3">
              <v-slider
                v-model.number="localGridOptions.gridOpacity"
                label="Grid Opacity"
                min="0.1"
                max="1"
                step="0.05"
                thumb-label
                hide-details
                class="flex-grow-1"
              />
              <span class="text-caption" style="min-width: 40px;">
                {{ Math.round((localGridOptions.gridOpacity || 0.6) * 100) }}%
              </span>
            </div>
            
            <v-switch
              v-model="localGridOptions.snapToGrid"
              label="Snap to Grid (center to center)"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
            />
            
            <!-- Grid Alignment Section -->
            <v-divider class="my-3" />
            <h4 class="text-subtitle-2 font-weight-bold mb-2">
              <v-icon icon="mdi-move-resize" size="small" class="mr-1" />
              Grid Alignment (match map grids)
            </h4>
            <p class="text-caption text-grey mb-2">
              Adjust offset to align with existing grids on map images
            </p>
            <div class="d-flex gap-2 mb-3">
              <v-text-field
                v-model.number="localGridOptions.offsetX"
                label="X Offset"
                type="number"
                density="compact"
                hide-details
                suffix="px"
                style="max-width: 120px;"
              />
              <v-text-field
                v-model.number="localGridOptions.offsetY"
                label="Y Offset"
                type="number"
                density="compact"
                hide-details
                suffix="px"
                style="max-width: 120px;"
              />
              <v-btn
                icon
                size="small"
                variant="tonal"
                @click="localGridOptions.offsetX = 0; localGridOptions.offsetY = 0"
              >
                <v-icon>mdi-restore</v-icon>
                <v-tooltip activator="parent" location="top">Reset Offset</v-tooltip>
              </v-btn>
            </div>
            <v-divider class="my-3" />
            
            <v-switch
              v-model="localGridOptions.showMajorGridLines"
              label="Show Major Grid Lines (every 5 squares)"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
            />
            
            <v-switch
              v-model="localGridOptions.showCoordinates"
              label="Show Grid Coordinates (A1, B2, etc.)"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
            />
            
            <!-- Diagonal Movement Rule -->
            <div class="mb-3">
              <v-select
                v-model="localGridOptions.diagonalRule"
                label="Diagonal Movement Rule"
                :items="[
                  { value: 'standard', title: 'Simple (5 ft per diagonal)' },
                  { value: 'alternating', title: 'Alternating (5-10-5-10 ft - PHB variant)' },
                  { value: 'euclidean', title: 'Euclidean (true distance)' },
                ]"
                item-value="value"
                item-title="title"
                density="compact"
                hide-details
              />
              <p class="text-caption text-grey mt-1">
                <v-icon icon="mdi-information-outline" size="x-small" class="mr-1" />
                Affects ruler tool distance calculations
              </p>
            </div>
            
            <!-- Portal Sync Settings -->
            <v-divider class="my-3" />
            <h4 class="text-subtitle-2 font-weight-bold mb-2">
              <v-icon icon="mdi-cast" class="mr-1" size="small" />
              Portal Sync
            </h4>
            <v-switch
              v-model="localGridOptions.showMeasurementsOnPortal"
              label="Show Measurements on Portal"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            <p class="text-caption text-grey">
              <v-icon icon="mdi-information-outline" size="x-small" class="mr-1" />
              Sends ruler measurements, movement trails, and pings to the portal view
            </p>
          </div>

          <v-divider class="my-4" />

          <!-- Background Settings -->
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-3">
              <v-icon icon="mdi-image" class="mr-2" size="small" />
              Background Nodes
            </h3>
            <v-switch
              v-model="localLockBackgroundImages"
              label="Lock Background Nodes"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
            />
            <v-slider
              v-if="backgroundImageCount > 0"
              v-model="localBackgroundOpacity"
              label="Background Opacity"
              min="0"
              max="1"
              step="0.05"
              thumb-label
              hide-details
              class="mb-3"
            >
              <template #prepend>
                <v-icon icon="mdi-opacity" />
              </template>
            </v-slider>
            
            <v-alert
              v-if="backgroundImageCount > 0"
              type="info"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              {{ backgroundImageCount }} background node{{ backgroundImageCount > 1 ? 's' : '' }} on canvas.
            </v-alert>
            
            <div class="d-flex gap-2 mb-4">
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                @click="showFileManager = true"
                :prepend-icon="backgroundImageCount > 0 ? 'mdi-plus' : 'mdi-image-plus'"
              >
                {{ backgroundImageCount > 0 ? 'Add Another' : 'Add Background Node' }}
              </v-btn>
            </div>

            <v-divider class="my-3" />

            <h3 class="text-subtitle-1 font-weight-bold mb-3 mt-3">
              <v-icon icon="mdi-image-filter-hdr" class="mr-2" size="small" />
              Canvas Background (Fixed)
            </h3>
            <p class="text-caption text-grey-lighten-1 mb-3">
              A fixed background image that doesn't scale with zoom
            </p>
            
            <div class="d-flex gap-2">
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                @click="showCanvasBackgroundSelector = true"
                prepend-icon="mdi-image-plus"
              >
                {{ canvasBackgroundUrl ? 'Change' : 'Set Canvas Background' }}
              </v-btn>
              <v-btn
                v-if="canvasBackgroundUrl"
                color="error"
                variant="outlined"
                size="small"
                @click="removeCanvasBackground"
                prepend-icon="mdi-delete"
              >
                Remove
              </v-btn>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Portal Actions -->
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-3">
              <v-icon icon="mdi-projector-screen" class="mr-2" size="small" />
              Portal
            </h3>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-projector-screen"
              block
              @click="handleSendToPortal"
              :disabled="!hasActivePortal"
            >
              Send to Portal
            </v-btn>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showSettingsDialog = false">
            Close
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveSettings">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Library Item Selector -->
    <library-item-selector
      v-model="showItemSelector"
      :library-id="dmScreen.libraryId"
      @select="handleAddLibraryItem"
    />

    <!-- File Manager for Background Image -->
    <file-manager
      v-model="showFileManager"
      select-mode
      :multiple="false"
      return-type="id"
      filter-type="image"
      @select="handleBackgroundImageSelect"
    />

    <!-- File Manager for Canvas Background -->
    <file-manager
      v-model="showCanvasBackgroundSelector"
      select-mode
      :multiple="false"
      return-type="id"
      filter-type="image"
      @select="handleCanvasBackgroundSelect"
    />

    <!-- Shape Style Editor Dialog -->
    <v-dialog v-model="showShapeStyleDialog" max-width="400" persistent :attach="false">
      <v-card>
        <v-card-title>Edit Shape Style</v-card-title>
        <v-divider />
        <v-card-text class="py-6">
          <div class="d-flex flex-column gap-4">
            <!-- Fill Color -->
            <div>
              <label class="text-body2 font-weight-600 mb-2 d-block">Fill Color</label>
              <div class="d-flex gap-2">
                <input
                  v-model="editingShapeData.color"
                  type="color"
                  class="shape-color-picker"
                />
                <v-text-field
                  v-model="editingShapeData.color"
                  label="Hex Color"
                  density="compact"
                />
              </div>
            </div>

            <!-- Opacity -->
            <div>
              <label class="text-body2 font-weight-600 mb-2 d-block">
                Opacity: {{ Math.round((editingShapeData.opacity || 1) * 100) }}%
              </label>
              <v-slider
                v-model="editingShapeData.opacity"
                :min="0"
                :max="1"
                :step="0.1"
              />
            </div>

            <!-- Border Color -->
            <div>
              <label class="text-body2 font-weight-600 mb-2 d-block">Border Color</label>
              <div class="d-flex gap-2">
                <input
                  v-model="editingShapeData.borderColor"
                  type="color"
                  class="shape-color-picker"
                />
                <v-text-field
                  v-model="editingShapeData.borderColor"
                  label="Hex Color"
                  density="compact"
                />
              </div>
            </div>

            <!-- Border Width -->
            <div>
              <label class="text-body2 font-weight-600 mb-2 d-block">
                Border Width: {{ editingShapeData.borderWidth || 0 }}px
              </label>
              <v-slider
                v-model="editingShapeData.borderWidth"
                :min="0"
                :max="10"
                :step="1"
              />
            </div>

            <!-- Label -->
            <v-text-field
              v-model="editingShapeData.label"
              label="Label (optional)"
              density="compact"
            />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showShapeStyleDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveShapeStyle">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Node Context Menu (right-click on node) -->
    <div
      v-if="showNodeContextMenu"
      class="context-menu-overlay"
      @click="closeContextMenus"
      @contextmenu.prevent="closeContextMenus"
    />
    <div
      v-if="showNodeContextMenu"
      class="context-menu-container"
      :style="{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }"
    >
      <v-card min-width="200" class="context-menu-card">
        <v-list density="compact" class="py-1">
          <!-- Duplicate -->
          <v-list-item
            prepend-icon="mdi-content-copy"
            title="Duplicate"
            @click="contextMenuDuplicate"
          />
          
          <v-divider class="my-1" />
          
          <!-- Layer ordering -->
          <v-list-item
            prepend-icon="mdi-arrange-bring-to-front"
            title="Bring to Front"
            @click="contextMenuBringToFront"
          />
          <v-list-item
            prepend-icon="mdi-arrange-send-to-back"
            title="Send to Back"
            @click="contextMenuSendToBack"
          />
          
          <v-divider class="my-1" />
          
          <!-- Move to Layer submenu -->
          <v-menu location="end" open-on-hover :close-on-content-click="true">
            <template #activator="{ props: menuProps }">
              <v-list-item
                v-bind="menuProps"
                prepend-icon="mdi-layers-outline"
                title="Move to Layer"
                append-icon="mdi-chevron-right"
              />
            </template>
            <v-card min-width="180" class="context-menu-card">
              <v-list density="compact" class="py-1">
                <v-list-item
                  v-for="layer in layers"
                  :key="layer.id"
                  :title="layer.name"
                  :prepend-icon="layer.id === contextMenuItemLayer ? 'mdi-check' : 'mdi-layers'"
                  :disabled="layer.id === contextMenuItemLayer"
                  @click="contextMenuMoveToLayer(layer.id)"
                />
              </v-list>
            </v-card>
          </v-menu>
          
          <v-divider class="my-1" />
          
          <!-- Delete -->
          <v-list-item
            prepend-icon="mdi-delete"
            title="Delete"
            class="text-error"
            @click="contextMenuDeleteItem"
          />
        </v-list>
      </v-card>
    </div>

    <!-- Pane Context Menu (right-click on canvas) -->
    <div
      v-if="showPaneContextMenu"
      class="context-menu-overlay"
      @click="closeContextMenus"
      @contextmenu.prevent="closeContextMenus"
    />
    <div
      v-if="showPaneContextMenu"
      class="context-menu-container"
      :style="{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }"
    >
      <v-card min-width="220" class="context-menu-card">
        <v-list density="compact" class="py-1">
          <!-- Add Library Item -->
          <v-list-item
            prepend-icon="mdi-card-plus-outline"
            title="Add Library Item"
            @click="contextMenuAddLibraryItem"
          />
          
          <v-divider class="my-1" />
          
          <!-- Add Text Note -->
          <v-list-item
            prepend-icon="mdi-text-box-plus-outline"
            title="Add Text Note"
            @click="contextMenuAddTextNode"
          />
          
          <!-- Add Shape -->
          <v-list-item
            prepend-icon="mdi-shape-plus"
            title="Add Shape"
            @click="contextMenuAddShapeNode"
          />
          
          <!-- Add User File -->
          <v-list-item
            prepend-icon="mdi-file-image-plus"
            title="Add File/Image"
            @click="contextMenuAddUserFile"
          />
          
          <v-divider class="my-1" />
          
          <!-- Add Effect submenu -->
          <v-menu location="end" open-on-hover :close-on-content-click="true">
            <template #activator="{ props: menuProps }">
              <v-list-item
                v-bind="menuProps"
                prepend-icon="mdi-creation"
                title="Add Effect"
                append-icon="mdi-chevron-right"
              />
            </template>
            <v-card min-width="200" max-height="400" class="context-menu-card overflow-y-auto">
              <v-list density="compact" class="py-1">
                <v-list-subheader class="text-caption">Particle Effects</v-list-subheader>
                <v-list-item
                  v-for="preset in EFFECT_PRESETS.filter(p => ['fire', 'torch', 'campfire', 'snow', 'rain', 'fog', 'smoke', 'sparkles', 'fireflies', 'dust', 'embers'].includes(p.effectType))"
                  :key="preset.id"
                  :prepend-icon="preset.icon"
                  :title="preset.name"
                  :subtitle="preset.description"
                  @click="contextMenuAddEffect(preset)"
                />
                
                <v-divider class="my-1" />
                
                <v-list-subheader class="text-caption">Light Effects</v-list-subheader>
                <v-list-item
                  v-for="preset in EFFECT_PRESETS.filter(p => ['lightRing', 'aura', 'magicCircle'].includes(p.effectType))"
                  :key="preset.id"
                  :prepend-icon="preset.icon"
                  :title="preset.name"
                  :subtitle="preset.description"
                  @click="contextMenuAddEffect(preset)"
                />
              </v-list>
            </v-card>
          </v-menu>
        </v-list>
      </v-card>
    </div>

    <!-- Empty State -->
    <div v-if="!dmScreen.items || dmScreen.items.length === 0" class="empty-state-overlay">
      <div class="empty-state-content">
        <v-icon icon="mdi-monitor-dashboard" size="120" color="grey-lighten-1" class="mb-6" />
        <h2 class="text-h4 font-weight-bold mb-4">No items in DM screen</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-4">
          Use the toolbar buttons to add items or background images.
        </p>
        <div class="empty-state-actions">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="showItemSelector = true"
          >
            Add Item
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-image-plus"
            @click="showFileManager = true"
          >
            Add Background
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted, watch } from 'vue'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, NodeDragEvent, NodeChange } from '@vue-flow/core'
import type { DmScreen, DmScreenItem, DmScreenSettings, GridOptions, DmScreenLayer, VttToolMode, MeasurementLine } from '@/types/dmScreen.types'
import { EFFECT_PRESETS, getDefaultGridOptions, calculateDistanceFeet } from '@/types/dmScreen.types'
import type { LibraryItem } from '@/types/item.types'
import DmScreenFlowNode from './DmScreenFlowNode.vue'
import GridNode from './GridNode.vue'
import LayerControl from './LayerControl.vue'
import LibraryItemSelector from './LibraryItemSelector.vue'
import FileManager from '@/components/files/FileManager.vue'
import EffectsPanel from './EffectsPanel.vue'
import ShapesPanel from './ShapesPanel.vue'
import TerrainPanel from './TerrainPanel.vue'
import KitbashingDrawers from './KitbashingDrawers.vue'
import VttToolbar from './VttToolbar.vue'
import MeasurementRuler from './MeasurementRuler.vue'
import type { EffectPreset, SVGShapePreset, TerrainPreset } from '@/types/dmScreen.types'
import { useDmScreensStore } from '@/stores/dmScreens'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useFilesStore } from '@/stores/files'
import { usePortalSocket } from '@/composables/usePortalSocket'
import { useToast } from 'vue-toastification'

// =====================================================
// PROPS & EMITS
// =====================================================

const props = defineProps<{
  dmScreen: DmScreen
  isPortalMode?: boolean
}>()

// =====================================================
// STORES & COMPOSABLES
// =====================================================

const dmScreensStore = useDmScreensStore()
const portalViewsStore = usePortalViewsStore()
const filesStore = useFilesStore()
const toast = useToast()

// Portal socket for receiving commands in portal mode
const { on: onPortalEvent, off: offPortalEvent, isConnected } = usePortalSocket()

// VueFlow composable with viewport controls
const { project, zoomIn, zoomOut, setViewport, getViewport, fitView, viewport, getNodes } = useVueFlow()

// Current viewport for grid synchronization
const currentViewport = computed(() => ({
  zoom: viewport.value.zoom || 1,
  x: viewport.value.x || 0,
  y: viewport.value.y || 0,
}))

// Convert flow coordinates to screen coordinates for SVG rendering
// VueFlow transform: screenPos = flowPos * zoom + pan
function toScreenX(flowX: number): number {
  const zoom = viewport.value.zoom || 1
  const panX = viewport.value.x || 0
  return flowX * zoom + panX
}

function toScreenY(flowY: number): number {
  const zoom = viewport.value.zoom || 1
  const panY = viewport.value.y || 0
  return flowY * zoom + panY
}
const vueFlowRef = ref<any>(null)

// =====================================================
// NODE TYPES (marked raw to prevent reactivity)
// =====================================================

const nodeTypes = markRaw({
  dmScreenItem: DmScreenFlowNode,
})

// =====================================================
// UI STATE (local only, no watchers)
// =====================================================

const showSettingsDialog = ref(false)
const showFileManager = ref(false)
const showItemSelector = ref(false)
const showCanvasBackgroundSelector = ref(false)
const showShapeStyleDialog = ref(false)
const canvasBackgroundUrl = ref<string | null>(null)

// Context menu state
const showNodeContextMenu = ref(false)
const showPaneContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuFlowPosition = ref({ x: 0, y: 0 })
const contextMenuNodeId = ref<string | null>(null)

// Local settings for dialog editing (with VTT defaults)
const localGridOptions = ref<GridOptions>(getDefaultGridOptions())
const localLockBackgroundImages = ref(false)
const localBackgroundOpacity = ref(1)

// Shape editor state
const editingShapeData = ref({
  shape: 'circle' as 'circle' | 'square' | 'triangle',
  color: '#6366f1',
  opacity: 1,
  borderColor: '#ffffff',
  borderWidth: 0,
  label: '',
})
const editingShapeItemId = ref<string | null>(null)

// VTT Tool state
const vttToolbarRef = ref<InstanceType<typeof VttToolbar> | null>(null)
const measurementRulerRef = ref<InstanceType<typeof MeasurementRuler> | null>(null)
const currentVttTool = ref<VttToolMode>('select')
const localDiagonalRule = ref<'standard' | 'alternating' | 'euclidean'>('standard')

// Ping state
const activePing = ref<{ x: number; y: number; timestamp: number } | null>(null)

// Portal-received measurement lines (from DM to viewers)
const portalMeasurementLines = ref<MeasurementLine[]>([])
const portalMeasurementTotal = ref<number>(0)

// Movement tracking state (shows distance while dragging)
const isDragging = ref(false)
const dragNodeId = ref<string | null>(null)
const dragNodeType = ref<string | null>(null)
const dragStartPosition = ref<{ x: number; y: number } | null>(null)
const dragCurrentPosition = ref<{ x: number; y: number } | null>(null)

// Movement trail state - now supports stacking (multiple segments)
interface TrailSegment {
  startX: number
  startY: number
  endX: number
  endY: number
  distance: { squares: number; feet: number }
}

const movementTrail = ref<{
  nodeId: string
  segments: TrailSegment[]
  totalDistance: { squares: number; feet: number }
} | null>(null)

// Add a segment to the stacked trail
function addTrailSegment(nodeId: string, startPos: { x: number; y: number }, endPos: { x: number; y: number }) {
  const gridSize = gridOptions.value.gridSize || 50
  const feetPerSquare = gridOptions.value.feetPerSquare || 5
  const diagonalRule = gridOptions.value.diagonalRule || 'standard'
  
  // Calculate distance for this segment
  const dist = calculateDistanceFeet(
    startPos.x, startPos.y, endPos.x, endPos.y,
    gridSize, feetPerSquare, diagonalRule
  )
  
  const newSegment: TrailSegment = {
    startX: startPos.x,
    startY: startPos.y,
    endX: endPos.x,
    endY: endPos.y,
    distance: dist,
  }
  
  if (movementTrail.value && movementTrail.value.nodeId === nodeId) {
    // Add to existing trail
    movementTrail.value.segments.push(newSegment)
    movementTrail.value.totalDistance = {
      squares: movementTrail.value.totalDistance.squares + dist.squares,
      feet: movementTrail.value.totalDistance.feet + dist.feet,
    }
  } else {
    // Start new trail
    movementTrail.value = {
      nodeId,
      segments: [newSegment],
      totalDistance: dist,
    }
  }
}

// Calculate distance including both horizontal AND vertical movement
const movementDistance = computed(() => {
  if (!dragStartPosition.value || !dragCurrentPosition.value) return null
  
  const gridSize = gridOptions.value.gridSize || 50
  const feetPerSquare = gridOptions.value.feetPerSquare || 5
  const diagonalRule = gridOptions.value.diagonalRule || 'standard'
  
  const dx = dragCurrentPosition.value.x - dragStartPosition.value.x
  const dy = dragCurrentPosition.value.y - dragStartPosition.value.y
  
  // Calculate squares moved in each direction
  const squaresX = Math.abs(Math.round(dx / gridSize))
  const squaresY = Math.abs(Math.round(dy / gridSize))
  
  let squares: number
  let feet: number
  
  // Calculate based on diagonal rule
  if (diagonalRule === 'euclidean') {
    // True distance
    squares = Math.sqrt(squaresX * squaresX + squaresY * squaresY)
    feet = Math.round(squares * feetPerSquare)
  } else if (diagonalRule === 'alternating') {
    // 5-10-5-10 rule
    const diagonals = Math.min(squaresX, squaresY)
    const straights = Math.abs(squaresX - squaresY)
    squares = straights + diagonals
    feet = (straights + Math.floor(diagonals * 1.5)) * feetPerSquare
  } else {
    // Standard: max of horizontal or vertical (diagonal = 5ft)
    squares = Math.max(squaresX, squaresY)
    feet = squares * feetPerSquare
  }
  
  return { squares: Math.round(squares), feet, dx: squaresX, dy: squaresY }
})

// Node types that show movement trails
const TRAIL_NODE_TYPES = ['TokenNode', 'EffectNode', 'ShapeNode']

// Check if dragging node should show movement trail
const showMovementTrail = computed(() => {
  if (!isDragging.value || !dragNodeType.value) return false
  return TRAIL_NODE_TYPES.includes(dragNodeType.value)
})

// =====================================================
// COMPUTED (derived from props, no watchers needed)
// =====================================================

// Grid options from settings (with VTT defaults)
const gridOptions = computed<GridOptions>(() => {
  const defaults = getDefaultGridOptions()
  const settings = props.dmScreen.settings || {}
  
  // Extract grid-related properties from settings
  const opts = {
    ...defaults,
    showGrid: settings.showGrid ?? defaults.showGrid,
    gridSize: settings.gridSize ?? defaults.gridSize,
    gridColor: settings.gridColor ?? defaults.gridColor,
    gridLineWidth: settings.gridLineWidth ?? defaults.gridLineWidth,
    gridOpacity: settings.gridOpacity ?? defaults.gridOpacity,
    snapToGrid: settings.snapToGrid ?? defaults.snapToGrid,
    offsetX: settings.offsetX ?? defaults.offsetX,
    offsetY: settings.offsetY ?? defaults.offsetY,
    feetPerSquare: settings.feetPerSquare ?? defaults.feetPerSquare,
    showCoordinates: settings.showCoordinates ?? defaults.showCoordinates,
    gridStyle: settings.gridStyle ?? defaults.gridStyle,
    showMajorGridLines: settings.showMajorGridLines ?? defaults.showMajorGridLines,
    majorGridInterval: settings.majorGridInterval ?? defaults.majorGridInterval,
    majorGridColor: settings.majorGridColor ?? defaults.majorGridColor,
    diagonalRule: settings.diagonalRule ?? defaults.diagonalRule,
    showMeasurementsOnPortal: settings.showMeasurementsOnPortal ?? defaults.showMeasurementsOnPortal,
  }
  
  console.log('[DmScreenWrapper] gridOptions computed:', {
    settings: settings,
    gridOpacity: settings.gridOpacity,
    gridSize: settings.gridSize,
    computed: opts
  })
  
  return opts
})

// Lock background images setting
const lockBackgroundImages = computed(() => {
  return props.dmScreen.settings?.lockBackgroundImages || false
})

// Background opacity setting
const backgroundOpacity = computed(() => {
  return props.dmScreen.settings?.backgroundOpacity ?? 1
})

// Count background images
const backgroundImageCount = computed(() => {
  if (!props.dmScreen.items) return 0
  return props.dmScreen.items.filter((item: DmScreenItem) => 
    item.type === 'UserFileId' && item.data.isBackground === true
  ).length
})

// Check if portal is active
const hasActivePortal = computed(() => !!portalViewsStore.activePortal)

// Canvas background style
const canvasBackgroundStyle = computed(() => {
  if (canvasBackgroundUrl.value) {
    return {
      backgroundImage: `url(${canvasBackgroundUrl.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return {}
})

// =====================================================
// LAYERS - Get layers from store
// =====================================================

const layers = computed(() => {
  return dmScreensStore.getLayers(props.dmScreen.id)
})

// =====================================================
// NODES COMPUTED - Convert items to VueFlow nodes
// Items are sorted by layer order, then by item order within layer
// =====================================================

const nodes = computed<Node[]>(() => {
  if (!props.dmScreen.items) return []
  
  // Get items sorted by layer order
  const sortedItems = dmScreensStore.getItemsSortedByLayer(props.dmScreen.id)
  
  // Create a map of layer order for z-index calculation
  const layerOrderMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.order]))
  const layerVisibilityMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.visible]))
  const layerOpacityMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.opacity]))
  const layerLockedMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.locked]))
  
  // Create showOnPortal map
  const layerShowOnPortalMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.showOnPortal]))
  
  return sortedItems
    .filter(item => {
      // Filter out items in hidden layers
      const layerId = item.layer || 'screen'
      const isVisible = layerVisibilityMap.get(layerId) !== false
      
      // In portal mode, also filter by showOnPortal
      if (props.isPortalMode) {
        const showOnPortal = layerShowOnPortalMap.get(layerId)
        return isVisible && showOnPortal !== false
      }
      
      return isVisible
    })
    .map((item: DmScreenItem, index: number) => {
      const nodeOptions = item.nodeOptions || {}
      const position = nodeOptions.position || { x: nodeOptions.x || 0, y: nodeOptions.y || 0 }
      const layerId = item.layer || 'screen'
      const layerOrder = layerOrderMap.get(layerId) ?? 1
      const layerOpacity = layerOpacityMap.get(layerId) ?? 1
      const layerLocked = layerLockedMap.get(layerId) ?? false
      
      // Legacy support for isBackground flag
      const isBackground = item.data.isBackground === true || layerId === 'background'
      const isLocked = layerLocked || (isBackground && lockBackgroundImages.value)
      
      // Calculate opacity: layer opacity * item opacity (if background)
      const itemOpacity = isBackground 
        ? layerOpacity * backgroundOpacity.value 
        : layerOpacity
      
      const rotation = nodeOptions.rotation || 0
      
      // Determine dimensions
      let width = nodeOptions.width || 300
      let height = nodeOptions.height || 200
      
      // TokenNode uses smaller circular dimensions
      if (item.type === 'TokenNode') {
        width = nodeOptions.width || 100
        height = nodeOptions.height || 100
      }
      
      // EffectNode uses square dimensions
      if (item.type === 'EffectNode') {
        width = nodeOptions.width || 150
        height = nodeOptions.height || 150
      }
      
      // Calculate z-index based on layer order and item order
      // Layer order * 1000 + item order within layer
      const baseZIndex = layerOrder * 1000
      const itemZIndex = baseZIndex + (item.order || index)
      
      return {
        id: item.id,
        type: 'dmScreenItem',
        position: {
          x: position.x,
          y: position.y,
        },
        data: {
          item,
          libraryId: props.dmScreen.libraryId,
          dmScreenId: props.dmScreen.id,
          snapToGrid: gridOptions.value.snapToGrid,
          gridSize: gridOptions.value.gridSize,
          backgroundOpacity: itemOpacity,
          rotation,
          layerId,
          layerLocked,
          isPortalMode: props.isPortalMode, // Pass portal mode to hide controls
        },
        draggable: !isLocked,
        selectable: !isLocked,
        width,
        height,
        style: {
          opacity: itemOpacity,
          // Make locked items transparent to clicks - clicks pass through to pane
          pointerEvents: isLocked ? 'none' : 'auto',
        },
        zIndex: itemZIndex,
      }
    })
})

// =====================================================
// LIFECYCLE
// =====================================================

// Handle escape key to close context menus
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeContextMenus()
  }
}

onMounted(async () => {
  // Ensure layers are initialized (this persists default layers if none exist)
  dmScreensStore.ensureLayers(props.dmScreen.id, props.dmScreen.libraryId)
  
  // Load canvas background if set
  const canvasBackgroundId = props.dmScreen.settings?.canvasBackgroundImageId
  if (canvasBackgroundId) {
    try {
      canvasBackgroundUrl.value = await filesStore.getDownloadUrl(canvasBackgroundId)
    } catch (error) {
      console.error('[DmScreenWrapper] Failed to load canvas background:', error)
    }
  }
  
  // Initialize local settings from props
  initializeLocalSettings()
  
  // Set up portal command listeners (always listen for collaborative updates)
  setupPortalCommandListeners()
  
  // Add keyboard listener for context menu
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Clean up portal command listeners
  cleanupPortalCommandListeners()
  
  // Clean up keyboard listener
  window.removeEventListener('keydown', handleKeyDown)
})

// Watch for portal mode changes - always keep listeners active for collaborative updates
// (No cleanup needed - we want to receive collaborative updates even when not in portal mode)


// =====================================================
// PORTAL COMMAND HANDLERS (for portal mode)
// =====================================================

function handlePortalViewUpdate(data: any) {
  console.log('[DmScreenWrapper] Received portal-view-updated:', data, 'isPortalMode:', props.isPortalMode)
  
  const { command, deltaX, deltaY, dmScreen, dmScreenId } = data
  
  // Handle update-screen-item even when not in portal mode (DM screen is being viewed in portal)
  if (command === 'update-screen-item' && dmScreen) {
    // Check if this update is for this DM screen
    if (dmScreenId === props.dmScreen.id || dmScreen.id === props.dmScreen.id) {
      console.log('[DmScreenWrapper] Updating DM screen from portal:', dmScreen.id)
      // Update the store cache directly (no API call needed)
      dmScreensStore.updateDmScreenCache(dmScreen)
      // The computed properties will automatically update since they read from the store
      return
    }
  }
  
  // Other commands only work in portal mode
  if (!props.isPortalMode) return
  
  console.log('[DmScreenWrapper] Processing command:', command)
  
  switch (command) {
    case 'dm-screen-zoom-in':
      console.log('[DmScreenWrapper] Zoom in')
      handlePortalZoomIn()
      break
    case 'dm-screen-zoom-out':
      console.log('[DmScreenWrapper] Zoom out')
      handlePortalZoomOut()
      break
    case 'dm-screen-pan':
      console.log('[DmScreenWrapper] Pan:', deltaX, deltaY)
      handlePortalPan(deltaX || 0, deltaY || 0)
      break
    case 'dm-screen-reset-view':
      console.log('[DmScreenWrapper] Reset view')
      handlePortalResetView()
      break
    case 'ping':
      console.log('[DmScreenWrapper] Ping received:', data.x, data.y)
      handlePing(data.x, data.y)
      break
    case 'clear-ping':
      console.log('[DmScreenWrapper] Clear ping')
      handleClearPing()
      break
    case 'draw-movement-trail':
      console.log('[DmScreenWrapper] Draw movement trail')
      handleDrawMovementTrail(data.trail)
      break
    case 'clear-movement-trail':
      console.log('[DmScreenWrapper] Clear movement trail', data.nodeId ? `for node ${data.nodeId}` : 'all trails')
      handleClearMovementTrail(data.nodeId)
      break
    case 'draw-measurements':
      console.log('[DmScreenWrapper] Draw measurements')
      handleDrawMeasurements(data.lines, data.totalFeet)
      break
    case 'clear-measurements':
      console.log('[DmScreenWrapper] Clear measurements')
      handleClearMeasurements()
      break
    default:
      console.log('[DmScreenWrapper] Unknown command:', command)
  }
}

function handleCollaborativeUpdate(data: any) {
  console.log('[DmScreenWrapper] Received collaborative-update:', data)
  
  // Check if this DM screen is being displayed in any portal view
  // (Collaborative updates should apply to all DM screens viewing the portal)
  const currentPortalView = portalViewsStore.currentPortalView
  
  // If we have a portal view, check if this DM screen is in it
  // If no portal view, still process updates (might be from another DM screen)
  if (currentPortalView?.items) {
    const isDmScreenInPortal = currentPortalView.items.some(
      (item: any) => item.type === 'DmScreenViewer' && item.dmScreenId === props.dmScreen.id
    )
    
    if (!isDmScreenInPortal) {
      console.log('[DmScreenWrapper] DM screen not in portal, ignoring collaborative update')
      return
    }
  }
  
  // Handle collaborative updates from portal viewers or other DM screens
  // (pings, measurements, etc.)
  const { command } = data
  
  switch (command) {
    case 'ping':
      console.log('[DmScreenWrapper] Collaborative ping:', data.x, data.y)
      handlePing(data.x, data.y)
      break
    case 'clear-ping':
      console.log('[DmScreenWrapper] Collaborative clear ping')
      handleClearPing()
      break
    case 'draw-movement-trail':
      console.log('[DmScreenWrapper] Collaborative draw movement trail')
      handleDrawMovementTrail(data.trail)
      break
    case 'clear-movement-trail':
      console.log('[DmScreenWrapper] Collaborative clear movement trail')
      handleClearMovementTrail()
      break
    case 'draw-measurements':
      console.log('[DmScreenWrapper] Collaborative draw measurements')
      handleDrawMeasurements(data.lines, data.totalFeet)
      break
    case 'clear-measurements':
      console.log('[DmScreenWrapper] Collaborative clear measurements')
      handleClearMeasurements()
      break
    default:
      console.log('[DmScreenWrapper] Unknown collaborative command:', command)
  }
}

function setupPortalCommandListeners() {
  // Subscribe to portal-view-updated events via store's event system
  onPortalEvent('portal-view-updated', handlePortalViewUpdate)
  // Subscribe to collaborative-update events (from portal viewers)
  onPortalEvent('collaborative-update', handleCollaborativeUpdate)
  console.log('[DmScreenWrapper] Portal command listeners set up')
}

function cleanupPortalCommandListeners() {
  offPortalEvent('portal-view-updated', handlePortalViewUpdate)
  offPortalEvent('collaborative-update', handleCollaborativeUpdate)
  console.log('[DmScreenWrapper] Portal command listeners cleaned up')
}

function handlePortalZoomIn() {
  const vp = getViewport()
  const zoomFactor = 1.2
  const newZoom = Math.min(vp.zoom * zoomFactor, 4) // Max zoom 4x
  
  // Get viewport container center
  const container = document.querySelector('.dm-screen-flow')
  if (!container) {
    setViewport({ ...vp, zoom: newZoom }, { duration: 300 })
    return
  }
  
  const rect = container.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  // Calculate new pan to keep center in place
  // When zoom changes, we need to adjust pan to keep the same point at screen center
  const zoomRatio = newZoom / vp.zoom
  const newX = centerX - (centerX - vp.x) * zoomRatio
  const newY = centerY - (centerY - vp.y) * zoomRatio
  
  setViewport({ x: newX, y: newY, zoom: newZoom }, { duration: 300 })
}

function handlePortalZoomOut() {
  const vp = getViewport()
  const zoomFactor = 1.2
  const newZoom = Math.max(vp.zoom / zoomFactor, 0.2) // Min zoom 0.2x
  
  // Get viewport container center
  const container = document.querySelector('.dm-screen-flow')
  if (!container) {
    setViewport({ ...vp, zoom: newZoom }, { duration: 300 })
    return
  }
  
  const rect = container.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  // Calculate new pan to keep center in place
  const zoomRatio = newZoom / vp.zoom
  const newX = centerX - (centerX - vp.x) * zoomRatio
  const newY = centerY - (centerY - vp.y) * zoomRatio
  
  setViewport({ x: newX, y: newY, zoom: newZoom }, { duration: 300 })
}

function handlePortalPan(deltaX: number, deltaY: number) {
  const viewport = getViewport()
  setViewport({
    ...viewport,
    x: viewport.x + deltaX,
    y: viewport.y + deltaY,
  }, { duration: 150 })
}

function handlePortalResetView() {
  // Fit all nodes in view with some padding
  fitView({ padding: 0.2, duration: 500 })
}

function initializeLocalSettings() {
  const defaults = getDefaultGridOptions()
  const settings = props.dmScreen.settings || {}
  
  // Initialize local grid options from flattened settings
  localGridOptions.value = { 
    showGrid: settings.showGrid ?? defaults.showGrid,
    gridSize: settings.gridSize ?? defaults.gridSize,
    gridColor: settings.gridColor ?? defaults.gridColor,
    gridLineWidth: settings.gridLineWidth ?? defaults.gridLineWidth,
    gridOpacity: settings.gridOpacity ?? defaults.gridOpacity,
    snapToGrid: settings.snapToGrid ?? defaults.snapToGrid,
    offsetX: settings.offsetX ?? defaults.offsetX,
    offsetY: settings.offsetY ?? defaults.offsetY,
    feetPerSquare: settings.feetPerSquare ?? defaults.feetPerSquare,
    showCoordinates: settings.showCoordinates ?? defaults.showCoordinates,
    gridStyle: settings.gridStyle ?? defaults.gridStyle,
    showMajorGridLines: settings.showMajorGridLines ?? defaults.showMajorGridLines,
    majorGridInterval: settings.majorGridInterval ?? defaults.majorGridInterval,
    majorGridColor: settings.majorGridColor ?? defaults.majorGridColor,
    diagonalRule: settings.diagonalRule ?? defaults.diagonalRule,
    showMeasurementsOnPortal: settings.showMeasurementsOnPortal ?? defaults.showMeasurementsOnPortal,
  }
  
  localLockBackgroundImages.value = lockBackgroundImages.value
  localBackgroundOpacity.value = backgroundOpacity.value
  localDiagonalRule.value = settings.diagonalRule || 'standard'
}

// =====================================================
// VUEFLOW EVENT HANDLERS
// All handlers call store actions directly
// =====================================================

/**
 * Handle node changes - resize is handled by @resize-end in DmScreenFlowNode
 * This is left here for any other node changes VueFlow might emit
 */
function onNodesChange(_changes: NodeChange[]) {
  // Resize is now handled by @resize-end event in DmScreenFlowNode
  // This handler is kept for any other node changes if needed
}

/**
 * Track drag start for movement distance display
 */
function onNodeDragStart(event: NodeDragEvent) {
  const node = event.node
  const item = props.dmScreen.items?.find(i => i.id === node.id)
  
  isDragging.value = true
  dragNodeId.value = node.id
  dragNodeType.value = item?.type || null
  
  // Get node center position (not top-left)
  const nodeWidth = node.width || 100
  const nodeHeight = node.height || 100
  const centerX = node.position.x + nodeWidth / 2
  const centerY = node.position.y + nodeHeight / 2
  
  dragStartPosition.value = { x: centerX, y: centerY }
  dragCurrentPosition.value = { x: centerX, y: centerY }
  
  // Clear any existing trail when starting new drag
  if (movementTrail.value?.nodeId !== node.id) {
    movementTrail.value = null
  }
}

/**
 * Track drag movement for distance display
 */
function onNodeDrag(event: NodeDragEvent) {
  const node = event.node
  
  // Get node center position
  const nodeWidth = node.width || 100
  const nodeHeight = node.height || 100
  const centerX = node.position.x + nodeWidth / 2
  const centerY = node.position.y + nodeHeight / 2
  
  dragCurrentPosition.value = { x: centerX, y: centerY }
}

function onNodeDragStop(event: NodeDragEvent) {
  const primaryNode = event.node
  
  // Get all selected nodes (for multi-select movement)
  const allNodes = getNodes.value
  const selectedNodes = allNodes.filter(n => n.selected)
  
  // If multiple nodes selected, update all their positions
  const nodesToUpdate = selectedNodes.length > 1 ? selectedNodes : [primaryNode]
  
  for (const node of nodesToUpdate) {
    let x = node.position.x
    let y = node.position.y
    
    // Snap item CENTER to grid CENTER if enabled
    if (gridOptions.value.snapToGrid && gridOptions.value.gridSize) {
      const gridSize = gridOptions.value.gridSize
      const offsetX = gridOptions.value.offsetX || 0
      const offsetY = gridOptions.value.offsetY || 0
      
      // Get item dimensions
      const itemWidth = node.width || 100
      const itemHeight = node.height || 100
      
      // Calculate item's current center
      const centerX = x + itemWidth / 2
      const centerY = y + itemHeight / 2
      
      // Find the nearest grid cell center (accounting for grid offset)
      const gridCellX = Math.round((centerX - offsetX - gridSize / 2) / gridSize)
      const gridCellY = Math.round((centerY - offsetY - gridSize / 2) / gridSize)
      
      // Calculate snapped center position
      const snappedCenterX = gridCellX * gridSize + gridSize / 2 + offsetX
      const snappedCenterY = gridCellY * gridSize + gridSize / 2 + offsetY
      
      // Convert back to top-left position
      x = snappedCenterX - itemWidth / 2
      y = snappedCenterY - itemHeight / 2
    }
    
    // Update position in store (debounced API call)
    dmScreensStore.updateItemPosition(
      props.dmScreen.id,
      props.dmScreen.libraryId,
      node.id,
      x,
      y
    )
  }
  
  // Save trail for primary node (token/effect/shape nodes - persists until deselect)
  if (TRAIL_NODE_TYPES.includes(dragNodeType.value || '') 
      && dragStartPosition.value && movementDistance.value && movementDistance.value.squares > 0) {
    
    // Get final center position of primary node
    const nodeWidth = primaryNode.width || 100
    const nodeHeight = primaryNode.height || 100
    let finalX = primaryNode.position.x
    let finalY = primaryNode.position.y
    
    // Apply snap if enabled
    if (gridOptions.value.snapToGrid && gridOptions.value.gridSize) {
      const gridSize = gridOptions.value.gridSize
      const offsetX = gridOptions.value.offsetX || 0
      const offsetY = gridOptions.value.offsetY || 0
      const centerX = finalX + nodeWidth / 2
      const centerY = finalY + nodeHeight / 2
      const gridCellX = Math.round((centerX - offsetX - gridSize / 2) / gridSize)
      const gridCellY = Math.round((centerY - offsetY - gridSize / 2) / gridSize)
      finalX = gridCellX * gridSize + gridSize / 2 + offsetX - nodeWidth / 2
      finalY = gridCellY * gridSize + gridSize / 2 + offsetY - nodeHeight / 2
    }
    
    const finalCenterX = finalX + nodeWidth / 2
    const finalCenterY = finalY + nodeHeight / 2
    
    // Add to stacked trails instead of replacing
    addTrailSegment(primaryNode.id, dragStartPosition.value, { x: finalCenterX, y: finalCenterY })
    
    // Send trail to portal
    sendMovementTrailToPortal(movementTrail.value)
  }
  
  // Clear drag tracking (but keep trail)
  isDragging.value = false
  dragNodeId.value = null
  dragNodeType.value = null
  dragStartPosition.value = null
  dragCurrentPosition.value = null
}

function onNodeClick(event: any) {
  // Don't select nodes when measure or ping tool is active
  if (currentVttTool.value === 'measure' || currentVttTool.value === 'ping') {
    return
  }
  
  const nodeId = event.node?.id
  if (nodeId) {
    // Note: Locked items have pointer-events: none, so clicks pass through
    // to the pane and this handler won't be called for them
    
    // Always clear trail when selecting a node (even if same node, to ensure it's cleared everywhere)
    // This ensures trails are cleared when clicking on any node
    if (movementTrail.value) {
      clearMovementTrail(movementTrail.value.nodeId)
    }
    
    dmScreensStore.selectItem(nodeId)
  }
}

function onPaneClick(event: any) {
  // Handle ping tool
  if (currentVttTool.value === 'ping') {
    // Get container rect to properly convert coordinates
    const container = document.querySelector('.dm-screen-wrapper .vue-flow')
    if (container) {
      const rect = container.getBoundingClientRect()
      const relativeX = event.clientX - rect.left
      const relativeY = event.clientY - rect.top
      const flowPosition = project({ x: relativeX, y: relativeY })
      createPing(flowPosition.x, flowPosition.y)
    }
    return
  }
  
  // Always clear movement trail when clicking outside (deselecting)
  // This ensures trails are cleared everywhere (portal, other DM screens)
  clearMovementTrail()
  
  dmScreensStore.selectItem(null)
}

/**
 * Create a ping at the specified flow coordinates
 */
function createPing(x: number, y: number) {
  activePing.value = { x, y, timestamp: Date.now() }
  
  // Send ping to portal
  sendPingToPortal(x, y)
  
  // Auto-clear ping after 3 seconds
  setTimeout(() => {
    if (activePing.value?.timestamp === activePing.value?.timestamp) {
      activePing.value = null
      sendClearPingToPortal()
    }
  }, 3000)
}

/**
 * Send ping to portal (ALWAYS sent - pings are important for player communication)
 * Also sends collaborative update so other DM screens can see it
 */
async function sendPingToPortal(x: number, y: number) {
  try {
    const { usePortalSocket } = await import('@/composables/usePortalSocket')
    const { sendPortalViewUpdate, sendCollaborativeUpdate } = usePortalSocket()
    
    const payload = {
      command: 'ping',
      x,
      y,
    }
    
    // Send to portal viewers
    sendPortalViewUpdate(payload)
    // Send to other DM screens (collaborative)
    sendCollaborativeUpdate(payload)
  } catch (error) {
    // Portal might not be active
  }
}

/**
 * Send clear ping to portal (ALWAYS sent)
 * Also sends collaborative update so other DM screens can see it
 */
async function sendClearPingToPortal() {
  try {
    const { usePortalSocket } = await import('@/composables/usePortalSocket')
    const { sendPortalViewUpdate, sendCollaborativeUpdate } = usePortalSocket()
    
    const payload = {
      command: 'clear-ping',
    }
    
    // Send to portal viewers
    sendPortalViewUpdate(payload)
    // Send to other DM screens (collaborative)
    sendCollaborativeUpdate(payload)
  } catch (error) {
    // Portal might not be active
  }
}

/**
 * Clear movement trail and notify portal
 * Always sends clear command to ensure trails are cleared everywhere
 */
function clearMovementTrail(nodeId?: string) {
  // Get the nodeId from the current trail if not provided
  const trailNodeId = nodeId || movementTrail.value?.nodeId
  
  // Always send clear command (even if no local trail, might need to clear elsewhere)
  if (trailNodeId) {
    sendClearTrailToPortal(trailNodeId)
  } else {
    // If no specific nodeId, send general clear (clears all trails)
    sendClearTrailToPortal()
  }
  
  // Clear local trail
  if (movementTrail.value) {
    movementTrail.value = null
  }
}

/**
 * Send movement trail to portal for display (if enabled)
 * Also sends collaborative update so other DM screens can see it
 */
async function sendMovementTrailToPortal(trail: typeof movementTrail.value) {
  if (!trail || !trail.segments || trail.segments.length === 0) return
  if (!gridOptions.value.showMeasurementsOnPortal) return
  
  try {
    const { usePortalSocket } = await import('@/composables/usePortalSocket')
    const { sendPortalViewUpdate, sendCollaborativeUpdate } = usePortalSocket()
    
    const payload = {
      command: 'draw-movement-trail',
      trail: {
        nodeId: trail.nodeId,
        segments: trail.segments,
        totalDistance: trail.totalDistance,
      },
    }
    
    // Send to portal viewers
    sendPortalViewUpdate(payload)
    // Send to other DM screens (collaborative)
    sendCollaborativeUpdate(payload)
  } catch (error) {
    // Portal might not be active
  }
}

/**
 * Send clear trail command to portal (ALWAYS sent - like pings)
 * Also sends collaborative update so other DM screens can see it
 * @param nodeId - Optional nodeId to clear a specific trail. If not provided, clears all trails.
 */
async function sendClearTrailToPortal(nodeId?: string) {
  try {
    const { usePortalSocket } = await import('@/composables/usePortalSocket')
    const { sendPortalViewUpdate, sendCollaborativeUpdate } = usePortalSocket()
    
    const payload: any = {
      command: 'clear-movement-trail',
    }
    
    // Include nodeId if provided (for clearing specific trail)
    if (nodeId) {
      payload.nodeId = nodeId
    }
    
    // Send to portal viewers
    sendPortalViewUpdate(payload)
    // Send to other DM screens (collaborative)
    sendCollaborativeUpdate(payload)
  } catch (error) {
    // Portal might not be active
  }
}

// =====================================================
// CONTEXT MENU HANDLERS
// =====================================================

function handlePaneContextMenu(event: MouseEvent) {
  if (props.isPortalMode) return
  
  event.preventDefault()
  event.stopPropagation()
  
  // Close any open menus first
  showNodeContextMenu.value = false
  
  // Get screen position for menu
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  
  // Convert to flow coordinates for item placement
  contextMenuFlowPosition.value = project({ x: event.clientX, y: event.clientY })
  
  // Show pane context menu
  showPaneContextMenu.value = true
}

function handleNodeContextMenu(event: MouseEvent, nodeId: string) {
  if (props.isPortalMode) return
  
  event.preventDefault()
  event.stopPropagation()
  
  // Note: Locked items have pointer-events: none, so right-clicks pass through
  // to the pane and handlePaneContextMenu will be called instead
  
  // Close any open menus first
  showPaneContextMenu.value = false
  
  // Store node ID and position
  contextMenuNodeId.value = nodeId
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  
  // Select the node
  dmScreensStore.selectItem(nodeId)
  
  // Show node context menu
  showNodeContextMenu.value = true
}

function closeContextMenus() {
  showNodeContextMenu.value = false
  showPaneContextMenu.value = false
  contextMenuNodeId.value = null
}

// Context menu actions for nodes
function contextMenuDuplicate() {
  if (!contextMenuNodeId.value) return
  dmScreensStore.duplicateItem(props.dmScreen.id, props.dmScreen.libraryId, contextMenuNodeId.value)
  toast.success('Item duplicated')
  closeContextMenus()
}

function contextMenuBringToFront() {
  if (!contextMenuNodeId.value) return
  dmScreensStore.sendToFrontInLayer(props.dmScreen.id, props.dmScreen.libraryId, contextMenuNodeId.value)
  toast.success('Moved to front')
  closeContextMenus()
}

function contextMenuSendToBack() {
  if (!contextMenuNodeId.value) return
  dmScreensStore.sendToBackInLayer(props.dmScreen.id, props.dmScreen.libraryId, contextMenuNodeId.value)
  toast.success('Moved to back')
  closeContextMenus()
}

function contextMenuMoveToLayer(layerId: string) {
  if (!contextMenuNodeId.value) return
  dmScreensStore.moveItemToLayer(props.dmScreen.id, props.dmScreen.libraryId, contextMenuNodeId.value, layerId)
  const layer = layers.value.find((l: DmScreenLayer) => l.id === layerId)
  toast.success(`Moved to ${layer?.name || layerId} layer`)
  closeContextMenus()
}

function contextMenuDeleteItem() {
  if (!contextMenuNodeId.value) return
  dmScreensStore.deleteItem(props.dmScreen.id, props.dmScreen.libraryId, contextMenuNodeId.value)
  toast.success('Item deleted')
  closeContextMenus()
}

// Context menu actions for pane (adding items)
function contextMenuAddLibraryItem() {
  // Store position before opening selector
  lastContextMenuFlowPosition.value = { ...contextMenuFlowPosition.value }
  showItemSelector.value = true
  closeContextMenus()
}

function contextMenuAddTextNode() {
  dmScreensStore.addTextNode(props.dmScreen.id, props.dmScreen.libraryId, contextMenuFlowPosition.value, selectedLayerId.value)
  toast.success('Text node added')
  closeContextMenus()
}

function contextMenuAddShapeNode() {
  dmScreensStore.addShapeNode(props.dmScreen.id, props.dmScreen.libraryId, contextMenuFlowPosition.value, selectedLayerId.value)
  toast.success('Shape node added')
  closeContextMenus()
}

function contextMenuAddUserFile() {
  // Store position before opening file manager
  lastContextMenuFlowPosition.value = { ...contextMenuFlowPosition.value }
  showFileManager.value = true
  closeContextMenus()
}

function contextMenuAddEffect(preset: typeof EFFECT_PRESETS[0]) {
  dmScreensStore.addEffectNode(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    preset,
    contextMenuFlowPosition.value,
    selectedLayerId.value
  )
  toast.success(`Added ${preset.name} effect`)
  closeContextMenus()
}

// Get current item's layer for display
const contextMenuItemLayer = computed(() => {
  if (!contextMenuNodeId.value) return null
  const item = props.dmScreen.items?.find((i: DmScreenItem) => i.id === contextMenuNodeId.value)
  return item?.layer || 'screen'
})

// Selected layer for adding new items
const selectedLayerId = ref<string>('screen')

function handleLayerSelect(layerId: string) {
  selectedLayerId.value = layerId
}

// =====================================================
// VTT TOOL HANDLERS
// =====================================================

function handleVttToolChange(tool: VttToolMode) {
  currentVttTool.value = tool
  
  // Clear selection and trails when switching to non-select tools
  if (tool !== 'select') {
    dmScreensStore.selectItem(null)
    clearMovementTrail()
  }
}

function handleToggleGrid() {
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    showGrid: !gridOptions.value.showGrid,
  }
  dmScreensStore.updateSettings(props.dmScreen.id, props.dmScreen.libraryId, updatedSettings)
}

function handleToggleSnap() {
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    snapToGrid: !gridOptions.value.snapToGrid,
  }
  dmScreensStore.updateSettings(props.dmScreen.id, props.dmScreen.libraryId, updatedSettings)
}

function handleDiagonalRuleChange(rule: 'standard' | 'alternating' | 'euclidean') {
  localDiagonalRule.value = rule
  
  // Also persist to settings
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    diagonalRule: rule,
  }
  dmScreensStore.updateSettings(props.dmScreen.id, props.dmScreen.libraryId, updatedSettings)
}

function handleMeasurementEnd(result: { feet: number; squares: number; line: MeasurementLine }) {
  // Update the toolbar display
  vttToolbarRef.value?.setLastMeasurement({ feet: result.feet, squares: result.squares })
  
  // Could also emit or log measurement for history
  console.log(`[VTT] Measured: ${result.feet} ft (${result.squares} squares)`)
}

// =====================================================
// ITEM EVENT HANDLERS (called from DmScreenFlowNode)
// =====================================================

function handleItemUpdate(updatedItem: DmScreenItem) {
  dmScreensStore.updateItem(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    updatedItem.id,
    updatedItem
  )
}

function handleItemDelete(itemId: string) {
  dmScreensStore.deleteItem(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    itemId
  )
  toast.success('Item removed')
}

function handleItemResize(itemId: string, width: number, height: number, x?: number, y?: number) {
  dmScreensStore.updateItemDimensions(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    itemId,
    width,
    height,
    x,
    y
  )
}

function handleItemRotate(itemId: string, rotation: number) {
  dmScreensStore.updateItemRotation(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    itemId,
    rotation
  )
}

// =====================================================
// ADD ITEM HANDLERS
// =====================================================

function getViewportCenter(itemWidth = 300, itemHeight = 200): { x: number; y: number } {
  try {
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = window.innerHeight / 2
    const flowPosition = project({ x: viewportCenterX, y: viewportCenterY })
    return {
      x: flowPosition.x - itemWidth / 2,
      y: flowPosition.y - itemHeight / 2,
    }
  } catch (error) {
    return { x: 400, y: 300 }
  }
}

// Store last context menu position for adding items from item selector
const lastContextMenuFlowPosition = ref<{ x: number; y: number } | null>(null)

async function handleAddLibraryItem(libraryItem: LibraryItem) {
  try {
    let featuredImageUrl: string | null = null
    if (libraryItem.featuredImage) {
      featuredImageUrl = await filesStore.getDownloadUrl(libraryItem.featuredImage.id)
    }

    const newItem = dmScreensStore.convertLibraryItemToDmScreenItem(
      libraryItem,
      featuredImageUrl
    )
    
    // Use stored context menu position if available, otherwise viewport center
    const position = lastContextMenuFlowPosition.value || getViewportCenter(300, 500)
    newItem.nodeOptions = {
      ...newItem.nodeOptions,
      x: position.x,
      y: position.y,
      position: position,
    }
    
    // Set layer if from context menu
    if (lastContextMenuFlowPosition.value) {
      newItem.layer = selectedLayerId.value
    }
    
    // Clear stored position
    lastContextMenuFlowPosition.value = null

    dmScreensStore.addItem(props.dmScreen.id, props.dmScreen.libraryId, newItem)
    toast.success('Item added to DM screen')
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add item:', error)
    toast.error('Failed to add item')
  }
}

async function handleBackgroundImageSelect(fileId: number | number[] | string | string[]) {
  const id = Array.isArray(fileId) 
    ? (typeof fileId[0] === 'number' ? fileId[0] : parseInt(fileId[0] as string, 10))
    : (typeof fileId === 'number' ? fileId : parseInt(fileId as string, 10))

  try {
    // Get image dimensions
    const dimensions = await getImageDimensions(id)
    const aspectRatio = dimensions.height / dimensions.width
    const fixedWidth = 500
    const calculatedHeight = Math.round(fixedWidth * aspectRatio)

    // Use stored context menu position if available, otherwise viewport center
    const position = lastContextMenuFlowPosition.value 
      ? {
          x: lastContextMenuFlowPosition.value.x - fixedWidth / 2,
          y: lastContextMenuFlowPosition.value.y - calculatedHeight / 2,
        }
      : getViewportCenter(fixedWidth, calculatedHeight)
    
    // Clear stored position
    lastContextMenuFlowPosition.value = null
    
    dmScreensStore.addBackgroundImage(
      props.dmScreen.id,
      props.dmScreen.libraryId,
      id,
      position,
      { width: fixedWidth, height: calculatedHeight }
    )

    toast.success('Background image added')
    showFileManager.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add background image:', error)
    toast.error('Failed to add background image')
  }
}

async function getImageDimensions(fileId: number): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    filesStore.getDownloadUrl(fileId).then(url => {
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        resolve({ width: 500, height: 375 })
      }
      img.src = url
    }).catch(() => {
      resolve({ width: 500, height: 375 })
    })
  })
}

// =====================================================
// SETTINGS HANDLERS
// =====================================================

function saveSettings() {
  // Sync the diagonal rule with local state
  localDiagonalRule.value = localGridOptions.value.diagonalRule || 'standard'
  
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    // Flatten grid options directly into settings
    showGrid: localGridOptions.value.showGrid,
    gridSize: localGridOptions.value.gridSize,
    gridColor: localGridOptions.value.gridColor,
    gridLineWidth: localGridOptions.value.gridLineWidth,
    gridOpacity: localGridOptions.value.gridOpacity ?? 0.6,
    snapToGrid: localGridOptions.value.snapToGrid,
    offsetX: localGridOptions.value.offsetX,
    offsetY: localGridOptions.value.offsetY,
    feetPerSquare: localGridOptions.value.feetPerSquare,
    showCoordinates: localGridOptions.value.showCoordinates,
    gridStyle: localGridOptions.value.gridStyle,
    showMajorGridLines: localGridOptions.value.showMajorGridLines,
    majorGridInterval: localGridOptions.value.majorGridInterval,
    majorGridColor: localGridOptions.value.majorGridColor,
    diagonalRule: localGridOptions.value.diagonalRule,
    showMeasurementsOnPortal: localGridOptions.value.showMeasurementsOnPortal,
    lockBackgroundImages: localLockBackgroundImages.value,
    backgroundOpacity: localBackgroundOpacity.value,
  }
  
  dmScreensStore.updateSettings(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    updatedSettings
  )
  
  showSettingsDialog.value = false
  toast.success('Settings saved')
}

async function handleCanvasBackgroundSelect(fileId: number | number[] | string | string[]) {
  const id = Array.isArray(fileId) 
    ? (typeof fileId[0] === 'number' ? fileId[0] : parseInt(fileId[0] as string, 10))
    : (typeof fileId === 'number' ? fileId : parseInt(fileId as string, 10))

  try {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      canvasBackgroundImageId: id,
    }
    
    dmScreensStore.updateSettings(
      props.dmScreen.id,
      props.dmScreen.libraryId,
      updatedSettings
    )
    
    canvasBackgroundUrl.value = await filesStore.getDownloadUrl(id)
    toast.success('Canvas background set')
    showCanvasBackgroundSelector.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to set canvas background:', error)
    toast.error('Failed to set canvas background')
  }
}

function removeCanvasBackground() {
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    canvasBackgroundImageId: undefined,
  }
  
  dmScreensStore.updateSettings(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    updatedSettings
  )
  
  canvasBackgroundUrl.value = null
  toast.success('Canvas background removed')
}

// =====================================================
// SHAPE STYLE HANDLERS
// =====================================================

function openShapeStyleEditor(item: DmScreenItem) {
  if (item.type !== 'ShapeNode') return
  
  editingShapeItemId.value = item.id
  editingShapeData.value = {
    shape: item.data.shape as 'circle' | 'square' | 'triangle',
    color: item.data.color || '#6366f1',
    opacity: item.data.opacity ?? 1,
    borderColor: item.data.borderColor || '#ffffff',
    borderWidth: item.data.borderWidth || 0,
    label: item.data.label || '',
  }
  showShapeStyleDialog.value = true
}

function saveShapeStyle() {
  if (!editingShapeItemId.value) return

  const item = props.dmScreen.items?.find(i => i.id === editingShapeItemId.value)
  if (!item) return

  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      color: editingShapeData.value.color,
      opacity: editingShapeData.value.opacity,
      borderColor: editingShapeData.value.borderColor,
      borderWidth: editingShapeData.value.borderWidth,
      label: editingShapeData.value.label,
    },
  }

  dmScreensStore.updateItem(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    editingShapeItemId.value,
    updatedItem
  )
  
  showShapeStyleDialog.value = false
  toast.success('Shape style updated')
}

// =====================================================
// DRAG & DROP HANDLERS
// =====================================================

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  if (!event.dataTransfer) return
  
  try {
    let data = event.dataTransfer.getData('application/json')
    let parsed: any = null
    
    if (data) {
      try {
        parsed = JSON.parse(data)
      } catch (e) {
        // Try text/plain fallback
      }
    }
    
    // Handle effect drops
    if (parsed && parsed.type === 'effect-node') {
      const dropPosition = project({ x: event.clientX, y: event.clientY })
      const effectSize = 150
      
      dmScreensStore.addEffectNode(
        props.dmScreen.id,
        props.dmScreen.libraryId,
        parsed.effectPreset,
        { x: dropPosition.x - effectSize / 2, y: dropPosition.y - effectSize / 2 },
        parsed.targetLayer || 'screen'
      )
      
      toast.success(`Added ${parsed.effectPreset.name} effect`)
      return
    }
    
    // Handle text/plain effect format
    const textData = event.dataTransfer.getData('text/plain')
    if (textData && textData.startsWith('effect:')) {
      // Parse format: effect:effectId:layerId
      const parts = textData.split(':')
      const effectId = parts[1]
      const targetLayer = parts[2] || 'screen'
      
      // Find the effect preset
      const { EFFECT_PRESETS } = await import('@/types/dmScreen.types')
      const preset = EFFECT_PRESETS.find(p => p.id === effectId)
      
      if (preset) {
        const dropPosition = project({ x: event.clientX, y: event.clientY })
        const effectSize = 150
        
        dmScreensStore.addEffectNode(
          props.dmScreen.id,
          props.dmScreen.libraryId,
          preset,
          { x: dropPosition.x - effectSize / 2, y: dropPosition.y - effectSize / 2 },
          targetLayer
        )
        
        toast.success(`Added ${preset.name} effect`)
        return
      }
    }
    
    // Handle shape drops from ShapesPanel
    if (parsed && parsed.type === 'shape-node') {
      const dropPosition = project({ x: event.clientX, y: event.clientY })
      const shapeSize = 150
      
      dmScreensStore.addShapeNodeWithPreset(
        props.dmScreen.id,
        props.dmScreen.libraryId,
        parsed.shapePreset,
        { x: dropPosition.x - shapeSize / 2, y: dropPosition.y - shapeSize / 2 },
        parsed.targetLayer || 'screen'
      )
      
      toast.success(`Added ${parsed.shapePreset.name} shape`)
      return
    }
    
    // Handle text/plain shape format
    if (textData && textData.startsWith('shape:')) {
      // Parse format: shape:shapeId:layerId
      const parts = textData.split(':')
      const shapeId = parts[1]
      const targetLayer = parts[2] || 'screen'
      
      // Find the shape preset
      const { SVG_SHAPE_PRESETS } = await import('@/types/dmScreen.types')
      const preset = SVG_SHAPE_PRESETS.find(p => p.id === shapeId)
      
      if (preset) {
        const dropPosition = project({ x: event.clientX, y: event.clientY })
        const shapeSize = 150
        
        dmScreensStore.addShapeNodeWithPreset(
          props.dmScreen.id,
          props.dmScreen.libraryId,
          preset,
          { x: dropPosition.x - shapeSize / 2, y: dropPosition.y - shapeSize / 2 },
          targetLayer
        )
        
        toast.success(`Added ${preset.name} shape`)
        return
      }
    }
    
    // Handle terrain drops from TerrainPanel
    if (parsed && parsed.type === 'terrain-node') {
      const dropPosition = project({ x: event.clientX, y: event.clientY })
      const terrainSize = 200
      
      dmScreensStore.addTerrainNode(
        props.dmScreen.id,
        props.dmScreen.libraryId,
        parsed.terrainPreset,
        { x: dropPosition.x - terrainSize / 2, y: dropPosition.y - terrainSize / 2 },
        parsed.targetLayer || 'screen'
      )
      
      toast.success(`Added ${parsed.terrainPreset.name} terrain`)
      return
    }
    
    // Handle text/plain terrain format
    if (textData && textData.startsWith('terrain:')) {
      // Parse format: terrain:terrainId:layerId
      const parts = textData.split(':')
      const terrainId = parts[1]
      const targetLayer = parts[2] || 'screen'
      
      // Find the terrain preset
      const { TERRAIN_PRESETS } = await import('@/types/dmScreen.types')
      const preset = TERRAIN_PRESETS.find(p => p.id === terrainId)
      
      if (preset) {
        const dropPosition = project({ x: event.clientX, y: event.clientY })
        const terrainSize = 200
        
        // Generate a new seed for this instance
        const configWithNewSeed = {
          ...preset.defaultConfig,
          seed: Math.floor(Math.random() * 1000000),
        }
        
        dmScreensStore.addTerrainNode(
          props.dmScreen.id,
          props.dmScreen.libraryId,
          { ...preset, defaultConfig: configWithNewSeed },
          { x: dropPosition.x - terrainSize / 2, y: dropPosition.y - terrainSize / 2 },
          targetLayer
        )
        
        toast.success(`Added ${preset.name} terrain`)
        return
      }
    }
    
    // Handle file drops (existing logic)
    if (!parsed || !parsed.fileId) {
      if (textData && textData.startsWith('file:')) {
        // Parse format: file:123:layerId
        const parts = textData.split(':')
        const fileId = parseInt(parts[1], 10)
        const targetLayer = parts[2] || 'background'
        if (!isNaN(fileId)) {
          parsed = { type: 'user-file-background', fileId, targetLayer }
        }
      }
    }
    
    if (!parsed || !parsed.fileId) return
    
    const isBackgroundType = parsed.type === 'user-file-background'
    const isBackgroundNode = parsed.isBackground === true || isBackgroundType // Explicitly check for isBackground flag
    const targetLayer = parsed.targetLayer || (isBackgroundType ? 'background' : 'screen')
    const dropPosition = project({ x: event.clientX, y: event.clientY })
    
    console.log('[DmScreenWrapper] Drop:', { isBackgroundType, isBackgroundNode, targetLayer, parsed })
    
    if (isBackgroundType) {
      const dimensions = await getImageDimensions(parsed.fileId)
      const aspectRatio = dimensions.height / dimensions.width
      const fixedWidth = 500
      const calculatedHeight = Math.round(fixedWidth * aspectRatio)
      
      dmScreensStore.addBackgroundImage(
        props.dmScreen.id,
        props.dmScreen.libraryId,
        parsed.fileId,
        { x: dropPosition.x - fixedWidth / 2, y: dropPosition.y - calculatedHeight / 2 },
        { width: fixedWidth, height: calculatedHeight },
        targetLayer,
        isBackgroundNode // Pass the isBackground flag
      )
    } else {
      dmScreensStore.addUserFile(
        props.dmScreen.id,
        props.dmScreen.libraryId,
        parsed.fileId,
        { x: dropPosition.x - 150, y: dropPosition.y - 200 },
        targetLayer
      )
    }
    
    // Get layer name for toast message
    const layer = layers.value.find((l: DmScreenLayer) => l.id === targetLayer)
    const layerName = layer?.name || targetLayer
    toast.success(`Added to ${layerName} layer`)
  } catch (error) {
    console.error('[DmScreenWrapper] Failed to handle drop:', error)
    toast.error('Failed to add item')
  }
}

// Handle adding effect from click (adds at viewport center)
function handleAddEffect(preset: EffectPreset, layerId: string) {
  const effectSize = 150
  const center = getViewportCenter(effectSize, effectSize)
  
  dmScreensStore.addEffectNode(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    preset,
    center,
    layerId
  )
  
  toast.success(`Added ${preset.name} effect`)
}

// Handle adding shape from click (adds at viewport center)
function handleAddShape(preset: SVGShapePreset, layerId: string) {
  const shapeSize = 150
  const center = getViewportCenter(shapeSize, shapeSize)
  
  dmScreensStore.addShapeNodeWithPreset(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    preset,
    center,
    layerId
  )
  
  toast.success(`Added ${preset.name} shape`)
}

// Handle adding terrain from click (adds at viewport center)
function handleAddTerrain(preset: TerrainPreset, layerId: string) {
  const terrainSize = 200
  const center = getViewportCenter(terrainSize, terrainSize)
  
  dmScreensStore.addTerrainNode(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    preset,
    center,
    layerId
  )
  
  toast.success(`Added ${preset.name} terrain`)
}

// Handle adding file from kitbashing drawers
async function handleAddFileFromDrawer(file: { id: number }) {
  const center = getViewportCenter(300, 300)
  
  dmScreensStore.addBackgroundImage(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    file.id,
    center,
    { width: 300, height: 300 },
    selectedLayerId.value
  )
  
  toast.success('Image added from drawer')
}

// =====================================================
// PORTAL HANDLER
// =====================================================

async function handleSendToPortal() {
  if (!hasActivePortal.value) {
    toast.error('No active portal')
    return
  }
  
  try {
    await portalViewsStore.addDmScreenToActivePortal(props.dmScreen, true)
    toast.success('DM screen sent to portal')
    showSettingsDialog.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to send to portal:', error)
    toast.error(error.message || 'Failed to send to portal')
  }
}

// =====================================================
// PORTAL-SIDE HANDLERS (for receiving VTT data from DM)
// =====================================================

// Handle incoming measurements from DM
function handleDrawMeasurements(lines: MeasurementLine[], totalFeet: number) {
  portalMeasurementLines.value = lines
  portalMeasurementTotal.value = totalFeet
}

function handleClearMeasurements() {
  portalMeasurementLines.value = []
  portalMeasurementTotal.value = 0
}

// Handle incoming movement trail from DM (supports both old single format and new segment format)
function handleDrawMovementTrail(trail: {
  nodeId?: string
  segments?: TrailSegment[]
  totalDistance?: { squares: number; feet: number }
  // Legacy single segment format
  startX?: number
  startY?: number
  endX?: number
  endY?: number
  distance?: { squares: number; feet: number }
}) {
  // Support new segment-based format
  if (trail.segments && trail.segments.length > 0) {
    movementTrail.value = {
      nodeId: trail.nodeId || 'portal-trail',
      segments: trail.segments,
      totalDistance: trail.totalDistance || { squares: 0, feet: 0 },
    }
  } else if (trail.startX !== undefined && trail.endX !== undefined) {
    // Legacy single segment format
    movementTrail.value = {
      nodeId: 'portal-trail',
      segments: [{
        startX: trail.startX,
        startY: trail.startY!,
        endX: trail.endX,
        endY: trail.endY!,
        distance: trail.distance || { squares: 0, feet: 0 },
      }],
      totalDistance: trail.distance || { squares: 0, feet: 0 },
    }
  }
}

function handleClearMovementTrail(nodeId?: string) {
  // If no nodeId provided, clear all trails
  if (!nodeId) {
    movementTrail.value = null
    return
  }
  
  // If nodeId matches current trail, clear it
  if (movementTrail.value?.nodeId === nodeId) {
    movementTrail.value = null
  }
}

// Handle incoming ping from DM
function handlePing(x: number, y: number) {
  activePing.value = { x, y, timestamp: Date.now() }
  
  // Auto-clear ping after 3 seconds
  setTimeout(() => {
    if (activePing.value?.timestamp) {
      activePing.value = null
    }
  }, 3000)
}

function handleClearPing() {
  activePing.value = null
}

// =====================================================
// EXPOSE METHODS FOR PARENT/TOOLBAR
// =====================================================

defineExpose({
  // Dialog controls
  openSettings: () => {
    initializeLocalSettings()
    showSettingsDialog.value = true
  },
  openItemSelector: () => { showItemSelector.value = true },
  openFileManager: () => { showFileManager.value = true },
  openShapeStyleEditor,
  
  // Item actions (delegate to store)
  addTextNode: () => {
    const center = getViewportCenter(200, 100)
    dmScreensStore.addTextNode(props.dmScreen.id, props.dmScreen.libraryId, center)
    toast.success('Text node added')
  },
  addShapeNode: () => {
    const center = getViewportCenter(150, 150)
    dmScreensStore.addShapeNode(props.dmScreen.id, props.dmScreen.libraryId, center)
    toast.success('Shape node added')
  },
  
  // Toggle actions
  toggleLockBackground: () => {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      lockBackgroundImages: !lockBackgroundImages.value,
    }
    dmScreensStore.updateSettings(props.dmScreen.id, props.dmScreen.libraryId, updatedSettings)
  },
  toggleGrid: () => {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      showGrid: !gridOptions.value.showGrid,
    }
    dmScreensStore.updateSettings(props.dmScreen.id, props.dmScreen.libraryId, updatedSettings)
  },
  
  // Event handlers for node events
  handleItemUpdate,
  handleItemDelete,
  handleItemResize,
  handleItemRotate,
  
  // Portal control methods (called by PortalViewItem)
  handleDmScreenZoomIn: handlePortalZoomIn,
  handleDmScreenZoomOut: handlePortalZoomOut,
  handleDmScreenPan: handlePortalPan,
  handleDmScreenResetView: handlePortalResetView,
  
  // Portal-side VTT handlers (receive data from DM)
  handleDrawMeasurements,
  handleClearMeasurements,
  handleDrawMovementTrail,
  handleClearMovementTrail,
  handlePing,
  handleClearPing,
})
</script>

<style scoped>
.dm-screen-wrapper {
  width: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dm-screen-flow-container {
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
}

.dm-screen-flow-container--measuring,
.dm-screen-flow-container--pinging {
  cursor: crosshair;
}

.dm-screen-flow-container--measuring :deep(.vue-flow__pane),
.dm-screen-flow-container--pinging :deep(.vue-flow__pane) {
  cursor: crosshair !important;
}

/* Disable node interactions when measuring or pinging */
.dm-screen-flow-container--measuring :deep(.vue-flow__node),
.dm-screen-flow-container--pinging :deep(.vue-flow__node) {
  pointer-events: none !important;
  cursor: crosshair !important;
}

.dm-screen-flow {
  width: 100%;
  height: 100%;
  background: rgba(20, 20, 30, 0.5);
}

/* VTT Grid above everything except toolbar and kitbashing drawers */
.dm-screen-flow :deep(.vue-flow__background) {
  z-index: 9998 !important;
  pointer-events: none !important;
}

.dm-screen-flow :deep(.vue-flow__background svg) {
  z-index: 9998 !important;
}

.empty-state-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px;
  background: rgba(30, 30, 40, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.empty-state-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.shape-color-picker,
.color-picker {
  width: 50px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

/* MiniMap - positioned top right, smaller */
.minimap-top-right {
  position: absolute !important;
  top: 10px !important;
  right: 10px !important;
  bottom: auto !important;
  left: auto !important;
  width: 120px !important;
  height: 80px !important;
}

/* VTT Toolbar Panel - top center */
.vtt-toolbar-panel {
  top: 10px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: 10000 !important;
}

/* Movement Distance Display */
.movement-display-panel {
  top: 70px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: 10001 !important;
}

.movement-display {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(34, 197, 94, 0.9);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: bounceIn 0.2s ease-out;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.movement-feet {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 18px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  margin-right: 8px;
}

.movement-squares {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

/* Movement Trail SVG */
.movement-trail-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
  overflow: visible;
}

/* Ping animation */
.ping-ring {
  animation: pingPulse 1.5s ease-out infinite;
  transform-origin: center;
}

.ping-ring-1 {
  animation-delay: 0s;
}

.ping-ring-2 {
  animation-delay: 0.3s;
}

.ping-ring-3 {
  animation-delay: 0.6s;
}

@keyframes pingPulse {
  0% {
    opacity: 1;
    transform: scale(0.5);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

/* Kitbashing Panel - left side */
.kitbashing-panel {
  top: 50% !important;
  left: 10px !important;
  transform: translateY(-50%) !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: 10000 !important;
}

/* Unified Bottom Toolbar Panel */
.unified-bottom-panel {
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  transform: none !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: 10000 !important;
}

.unified-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
  background: rgba(22, 22, 32, 0.9);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Context Menu Styles */
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: transparent;
}

.context-menu-container {
  position: fixed;
  z-index: 9999;
  animation: contextMenuFadeIn 0.15s ease-out;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-card {
  background: rgba(30, 30, 40, 0.98) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.context-menu-card :deep(.v-list-item) {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 4px;
  margin: 2px 4px;
}

.context-menu-card :deep(.v-list-item:hover) {
  background: rgba(99, 102, 241, 0.15);
}

.context-menu-card :deep(.v-list-item__prepend) {
  margin-right: 12px;
}

.context-menu-card :deep(.v-list-item__prepend .v-icon) {
  font-size: 18px;
  opacity: 0.8;
}

.context-menu-card :deep(.v-list-item-title) {
  font-size: 13px;
}

.context-menu-card :deep(.v-list-item-subtitle) {
  font-size: 11px;
  opacity: 0.6;
}

.context-menu-card :deep(.v-list-subheader) {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.5;
  min-height: 28px;
  padding-top: 8px;
}

.context-menu-card :deep(.v-list-item.text-error) {
  color: rgb(var(--v-theme-error));
}

.context-menu-card :deep(.v-list-item.text-error .v-icon) {
  color: rgb(var(--v-theme-error));
}
</style>


