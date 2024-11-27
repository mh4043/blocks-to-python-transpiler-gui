const originalPythonCode = 
`# pygame can't handle complex conversions from svg to png (like text), so some images might not be shown correctly.
# you can convert svg (vector) images that include text to png (bit images) through Scratch

# region Imports
import pygame
import pygame_gui
import sys
from io import BytesIO
import zipfile
import json
import math
from enum import Enum
import random
import time
import asyncio
from collections import defaultdict
import numpy as np
import pygame_gui.elements.ui_button
import sounddevice as sd
import uuid
from typing import Coroutine, Any, Callable, Dict, Union, List, Tuple
import tkinter as tk
from tkinter import filedialog
import pygame.freetype
import inspect
from pathlib import Path
from copy import deepcopy
from datetime import datetime
from abc import ABC, abstractmethod
from PIL import Image as PILImage
import numpy as np
import traceback
import colorsys
# endregion

# region Enums and constant values
# --- General enum values ---
class EnumColors(Enum):
    MAIN_BACKGROUND = (230, 240, 255)
    WHITE = (255, 255, 255)
    BORDER = (180, 191, 214)

class EnumEventType(Enum):
    EVENT_START = pygame.USEREVENT + 1001
    EVENT_STOP = pygame.USEREVENT + 1002
    EVENT_BUTTON_PRESSED = pygame.USEREVENT + 1003
    EVENT_FIGURE_CLICKED = pygame.USEREVENT + 1004
    EVENT_BACKDROP_CLICKED = pygame.USEREVENT + 1005
    EVENT_BACKDROP_CHANGED = pygame.USEREVENT + 1006
    EVENT_EXCEEDED = pygame.USEREVENT + 1007
    EVENT_BROADCAST_RECIEVED = pygame.USEREVENT + 1008
    EVENT_START_CLONE = pygame.USEREVENT + 1009
eventTypeValues = {eventType.value for eventType in EnumEventType}

class EnumSpriteBoundaries(Enum):
    CENTER = 1 # Center of sprite must be within boundaries
    FULL = 2 # Whole sprite must be within boundaries
    PARTIAL = 3 # Only a small portion of sprite must be within boundaries

# --- Scratch enum values ---
class EnumGoTo(Enum):
    RANDOM = "_random_"
    MOUSE = "_mouse_"

class EnumRotateTowards(Enum):
    MOUSE = "_mouse_"

class EnumRotateStyle(Enum):
    AROUND = "all around"
    LEFT_RIGHT = "left-right"
    NO_ROTATE = "don't rotate"

class EnumEventExceeded(Enum):
    LOUDNESS = "LOUDNESS"
    TIMER = "TIMER"

class EnumBackdropChangeTo(Enum):
    NEXT = "next backdrop"
    PREVIOUS = "previous backdrop"
    RANDOM = "random backdrop"

class EnumLooksEffect(Enum):
    COLOR = "COLOR"
    FISHEYE = "FISHEYE"
    WHIRL = "WHIRL"
    PIXELATE = "PIXELATE"
    MOSAIC = "MOSAIC"
    BRIGHTNESS = "BRIGHTNESS"
    GHOST = "GHOST"

class EnumGoToLayer(Enum):
    FRONT = "front"
    BACK = "back"

class EnumGoForLayers(Enum):
    FORWARD = "forward"
    BACKWARD = "backward"

class EnumNumberName(Enum):
    NUMBER = "number"
    NAME = "name"

class EnumSoundEffect(Enum):
    PITCH = "PITCH"
    PAN = "PAN"

class EnumStop(Enum):
    ALL = "all"
    THIS_SCRIPT = "this script"
    OTHER_SPRITE_SCRIPTS = "other scripts in sprite"

class EnumCloneOf(Enum):
    MYSELF = "_myself_"

class EnumTouchingObject(Enum):
    MOUSE = "_mouse_"
    EDGE = "_edge_"

class EnumDistanceTo(Enum):
    MOUSE = "_mouse_"

class EnumDragMode(Enum):
    DRAGGABLE = "draggable"
    NOT_DRAGGABLE = "not draggable"

class EnumVariable(Enum):
    BACKDROP_NO = "backdrop #"
    BACKDROP_NAME = "backdrop name"
    VOLUME = "volume"
    POSITION_X = "x position"
    POSITION_Y = "y position"
    DIRECTION = "direction"
    COSTUME_NO = "costume #"
    COSTUME_NAME = "costume name"
    SIZE = "size"

class EnumVariableFrom(Enum):
    STAGE = "_stage_"

class EnumCurrent(Enum):
    YEAR = "YEAR"
    MONTH = "MONTH"
    DATE = "DATE"
    DAY_OF_WEEK = "DAYOFWEEK"
    HOUR = "HOUR"
    MINUTE = "MINUTE"
    SECOND = "SECOND"

class EnumMathOperation(Enum):
    ABSOLUTE = "abs"
    FLOOR = "floor"
    CEIL = "ceiling"
    SQRT = "sqrt"
    SIN = "sin"
    COS = "cos"
    TAN = "tan"
    ARCSIN = "asin"
    ARCCOS = "acos"
    ARCTAN = "atan"
    LN = "ln"
    LOG = "log"
    E_POWER = "e ^"
    TEN_POWER = "10 ^"

# --- All available buttons ---
buttons = {
    "any": None,
    "space": pygame.K_SPACE,
    "up arrow": pygame.K_UP,
    "down arrow": pygame.K_DOWN,
    "right arrow": pygame.K_RIGHT,
    "left arrow": pygame.K_LEFT,
    "a": pygame.K_a,
    "b": pygame.K_b,
    "c": pygame.K_c,
    "d": pygame.K_d,
    "e": pygame.K_e,
    "f": pygame.K_f,
    "g": pygame.K_g,
    "h": pygame.K_h,
    "i": pygame.K_i,
    "j": pygame.K_j,
    "k": pygame.K_k,
    "l": pygame.K_l,
    "m": pygame.K_m,
    "n": pygame.K_n,
    "o": pygame.K_o,
    "p": pygame.K_p,
    "q": pygame.K_q,
    "r": pygame.K_r,
    "s": pygame.K_s,
    "t": pygame.K_t,
    "u": pygame.K_u,
    "v": pygame.K_v,
    "w": pygame.K_w,
    "x": pygame.K_x,
    "y": pygame.K_y,
    "z": pygame.K_z,
    "0": pygame.K_0,
    "1": pygame.K_1,
    "2": pygame.K_2,
    "3": pygame.K_3,
    "4": pygame.K_4,
    "5": pygame.K_5,
    "6": pygame.K_6,
    "7": pygame.K_7,
    "8": pygame.K_8,
    "9": pygame.K_9,
}
# endregion

# region pygame_gui theme
# --- UI theme template for pygame_gui elements ---
ui_theme = {
    "#ask_panel_idle": {
        "colours": {
            "dark_bg": "#ffffff",
            "normal_border": "#b4bfd6"
        },
        "misc": {
            "shape": "rounded_rectangle",
            "shape_corner_radius": "18",
            "shadow_width": "0",
        }
    },

    "#ask_panel_hovered": {
        "prototype": "#ask_panel_idle",
        "colours": {
            "normal_border": "#855cd6"
        },
    },

    "#ask_panel_focused": {
        "prototype": "#ask_panel_idle",
        "colours": {
            "normal_border": "#855cd6"
        },
        "misc": {
            "border_width": "2",
            "shadow_width": "1"
        }
    },

    "#ask_input": {
        "colours": {
            "dark_bg": "#ffffff",
            "normal_text": "#000000",
            "selected_bg": "#3368d1",
            "selected_text": "#ffffff",
            "text_cursor": "#000000",
            "normal_border": "#ffffff"
        },
        "misc": {
            "border_width": "0",
            "shadow_width": "0",
            "padding": "0,0"
        }
    },

    "#ask_button": {
        "colours": {
            "normal_bg": "#855cd6",
            "normal_text": "#ffffff",
            "hovered_bg": "#6f4db3",
            "active_bg": "#6f4db3",
            "hovered_text": "#ffffff",
            "active_text": "#ffffff",
            "normal_border": "#855cd6",
            "hovered_border": "#855cd6",
            "active_border": "#855cd6"
        },
        "misc": {
            "shape": "ellipse"
        }
    },

    "#var_panel": {
        "colours": {
            "dark_bg": "#e6f0ff",
            "normal_border": "#ccd5e2"
        },
        "misc": {
            "shape": "rounded_rectangle",
            "shape_corner_radius": "4",
            "border_width": "1",
            "shadow_width": "0"
        }
    },

    "#var_panel_name": {
        "colours": {
            "dark_bg": "#ffffff",
            "normal_border": "#ccd5e2"
        },
        "misc": {
            "shape": "rounded_rectangle",
            "shape_corner_radius": "4,4,0,0",
            "border_width": "1",
            "shadow_width": "0"
        }
    },

    "#var_name_label": {
        "colours": {
            "dark_bg": "#e6f0ff00",
            "normal_text": "#000000",
        },
        "font": {
            "name": "Tahoma",
            "size": "12",
            "bold": "1"
        }
    },

    "#var_value_label": {
        "colours": {
            "dark_bg": "#ff8d1a",
            "normal_text": "#ffffff",
        },
        "font": {
            "name": "Tahoma",
            "size": "12",
            "bold": "1"
        }
    },

    "#list_name_label": {
        "colours": {
            "dark_bg": "#ffffff",
            "normal_text": "#000000",
        },
        "font": {
            "name": "Tahoma",
            "size": "12",
            "bold": "1"
        }
    },

    "#list_panel_item": {
        "colours": {
            "dark_bg": "#e6f0ff00",
            "normal_border": "#ccd5e200"
        },
        "misc": {
            "shape": "rectangle",
            "border_width": "0",
            "shadow_width": "0"
        }
    },

    "#list_content_panel": {
        "colours": {
            "dark_bg": "#ffffff00",
            "normal_border": "#ccd5e200"
        },
        "misc": {
            "shape": "rectangle",
            "border_width": "0",
            "shadow_width": "0"
        }
    },

    "#list_value_label": {
        "colours": {
            "dark_bg": "#ff661a",
            "normal_text": "#ffffff",
        },
        "font": {
            "name": "Tahoma",
            "size": "12",
            "bold": "1"
        },
        "misc": {
            "text_horiz_alignment": "left",
            "text_horiz_alignment_padding": "2"
        }
    },

    "#var_panel_length": {
        "colours": {
            "dark_bg": "#ffffff",
            "normal_border": "#ccd5e2"
        },
        "misc": {
            "shape": "rounded_rectangle",
            "shape_corner_radius": "0,0,4,4",
            "border_width": "1",
            "shadow_width": "0"
        }
    },

    "#ask_label_text": {
        "colours": {
            "dark_bg": "#ffffff",
            "normal_text": "#575e75",
        },
        "font": {
            "name": "Tahoma",
            "size": "12",
            "bold": "1"
        },
        "misc": {
            "text_horiz_alignment": "left",
            "text_horiz_alignment_padding": "0"
        }
    },

    "#ask_panel_container": {
        "colours": {
            "dark_bg": "#ffffff",
            "normal_border": "#b4bfd6"
        },
        "misc": {
            "shape": "rounded_rectangle",
            "shape_corner_radius": "4",
            "border_width": "1",
            "shadow_width": "0"
        }
    }
}
# endregion

class Game:
    """Game class for main game logic and loop."""
    def __init__(self):
        # --- Events specific parameters ---
        self.focused_key = None
        self.key_press_time = 0
        self.delay = 500 #ms

        self.stream: sd.InputStream = None
        self.isStreaming = False
        self.currentLoudness = 0
        self.previousLoudness = 0
        self.lastValue = None

        self.currentTimer = 0
        self.previousTimer = 0
        self.startTime = 0

        self.mousePressed = False
        self.mousePressedAt = (0, 0)
        self.answered = False
        self.answerText = ""
        self.isAsking = False

        self.pressedKeys: Dict[int, bool] = defaultdict(bool)

        self.left_mouse_button_pressed = False
        self.figure_pressed = False
        self.figure_pressed_object = None
        self.delta_x, self.delta_y = 0, 0

        self.username = ""

        self.var_panels: List[pygame_gui.elements.UIPanel] = []

        # --- Pygame initialization ---
        pygame.init()

        # starting width and height of drawing window
        self.original_width = 480
        self.original_height = 360
        # scale factors when we resize window
        self.scale_factors = [1, 2]
        self.scale_factor_index = 0
        self.scale_factor = self.scale_factors[self.scale_factor_index]
        self.scaled = False
        # margins from the whole window to the drawing window
        self.left_margin = 10
        self.right_margin = 10
        self.top_margin = 50
        self.bottom_margin = 10
        # width and height of drawing window
        self.width = self.original_width * self.scale_factor
        self.height = self.original_height * self.scale_factor
        # width and height of the whole window
        self.main_width = self.width + self.left_margin + self.right_margin
        self.main_height = self.height + self.top_margin + self.bottom_margin
        # coordinates of start and end of drawing window
        self.left_border = self.left_margin
        self.right_border = self.left_margin + self.width
        self.top_border = self.top_margin
        self.bottom_border = self.top_margin + self.height

        # Set up the display
        self.window = pygame.display.set_mode((self.main_width, self.main_height), pygame.RESIZABLE)
        pygame.display.set_caption('Skripta Scratch-Python')
        self.draw_window_border_weight = 1
        self.draw_window_rect = pygame.Rect(self.left_margin, self.top_margin, self.width, self.height) # this is also the clipping rectangle - outside this window, figures are clipped
        self.draw_window_border_rect = pygame.Rect(self.left_margin - self.draw_window_border_weight, self.top_margin - self.draw_window_border_weight, self.width + 2*self.draw_window_border_weight, self.height + 2*self.draw_window_border_weight)

        self.manager = pygame_gui.UIManager((self.main_width, self.main_height), theme_path=ui_theme)

        # Initialize pygame mixer (for sound)
        pygame.mixer.init()
        pygame.mixer.set_num_channels(16) # default is 8

        self.gameRunning = False

        self.fps = 30
        self.frameDuration = 1 / self.fps

        self.subscribers: Dict[Stage | Figure, Dict[int, List[Script]] | Any] = {}
        self.new_subscribers = {}

        self.eventSystem = EventSystem(self)

        # --- Icons setup ---
        icon_width, icon_height = 32, 32
        self.start_rect = pygame.Rect(self.left_margin, self.bottom_margin, icon_width, icon_height) # Start icon
        self.stop_rect = pygame.Rect(2*self.left_margin + icon_width, self.bottom_margin, icon_width, icon_height) # Stop icon
        self.resize_rect = pygame.Rect(self.right_border - icon_width, self.bottom_margin, icon_width, icon_height)
        
        # // --- Dynamically created variables in JavaScript (#DYNAMIC) --- //

        stageBackdropNames = {#stageBackdropNames}
        currentBackdropIndex = {#currentBackdropIndex}
        # name, bitmap resolution, rotation center X, rotation center Y
        stageBackdropRotationCenters = {#stageBackdropRotationCenters}

        stageSoundNames = {#stageSoundNames}
        stageSoundVolume = {#stageSoundVolume}

        self.drawList = {#drawList}

        self.stage = {#stage}

        self.figures = {#figures}

        self.subscribers = {#subscribers}
        
        # // --- End of dynamically created variables in JavaScript (#DYNAMIC) --- //

        # Upload files
        self.upload_files(stageBackdropNames, currentBackdropIndex, stageBackdropRotationCenters, stageSoundNames, stageSoundVolume)

        self.drawListFigures: Dict[int, Figure] = self.set_draw_list_figures()

        # Set events with scripts to each target
        for subscriber, events in self.subscribers.items():
            subscriber._scripts = events
            subscriber._set_scripts()

    async def main(self):
        """Starts the main loop and async functions."""
        # Start timer
        self.restart_timer()
        
        self.gameRunning = True

        # Start checking loudness
        self.check_loudness()

        # Start event-checking (events + user input) task, draw task, and other tasks (loudness checking, ...)
        # Each time we go through drawList, drawListFigures, figures, subscribers, we make a copy of that list or copy of a dictionary as a list.
        # We do this because if an async function changes that list or dict (removes an item, ...), we might get an error that the size has changed.
        # So we make a copy which stays the same for the whole execution time of loop, and if we change list or dict, the changes will reflect the next time a loop is started.
        while self.gameRunning:
            await self.check_events()
            self.draw()

            # Cap the frame rate to FPS with sleep
            await asyncio.sleep(self.frameDuration) 

        self.stop_checking_loudness()

    async def check_events(self):
        """Checks pygame events and creates new ones."""
        self.previousTimer = self.currentTimer
        self.currentTimer = round(time.time() - self.startTime, 3)
        self.mousePressed = False

        mouse_x, mouse_y = pygame.mouse.get_pos()

        # Dragging figures
        left_mouse_button_held = pygame.mouse.get_pressed()[0]
        if(left_mouse_button_held):
            if(not self.left_mouse_button_pressed):
                # Once per mouse button click
                self.left_mouse_button_pressed = True
                go_front = False
                figure_drawableId = 0
                # Each time we go through drawList, drawListFigures, figures, subscribers, we make a copy of that list or copy of a dictionary as a list.
                # We do this because if an async function changes that list or dict (removes an item, ...), we might get an error that the size has changed.
                # So we make a copy which stays the same for the whole execution time of loop, and if we change list or dict, the changes will reflect the next time a loop is started.
                for drawableId in reversed(self.drawList[:]):
                    figure = self.drawListFigures[drawableId]
                    image_rect, _ = figure._get_image_and_boudning_rect()
                    if(figure._intersect(mouse_x, mouse_y)):
                        new_x = mouse_x - image_rect.left
                        new_y = mouse_y - image_rect.top
                        pixel_color = figure._current_costume().image.get_at((new_x, new_y))
                        if(pixel_color.a > 0):
                            self.figure_pressed = True
                            self.figure_pressed_object = figure
                            # Distance from sprite position to where the mouse was clicked (to keep that distance while dragging)
                            self.delta_x = mouse_x - figure._pos_x
                            self.delta_y = mouse_y - figure._pos_y
                            if(self.figure_pressed_object._dragMode == EnumDragMode.DRAGGABLE):
                                # If clicked on figure, it goes to the front layer
                                go_front = True
                                figure_drawableId = drawableId
                            break
                if(go_front and figure_drawableId in self.drawList):
                    indx = self.drawList.index(figure_drawableId)
                    self.drawList.pop(indx)
                    self.drawList.append(figure_drawableId)
                    go_front = False
            else:
                if(self.figure_pressed and self.figure_pressed_object._dragMode == EnumDragMode.DRAGGABLE):
                    self.figure_pressed_object._pos_x = mouse_x - self.delta_x
                    self.figure_pressed_object._pos_y = mouse_y - self.delta_y
                    self.figure_pressed_object._contain_within_boundries(EnumSpriteBoundaries.PARTIAL)
        else:
            self.left_mouse_button_pressed = False
            self.figure_pressed = False
            self.figure_pressed_object = None

        new_event = pygame.event.Event(EnumEventType.EVENT_EXCEEDED.value, {
            "timer": EnumEventExceeded.TIMER.value, 
            "currentTimer": self.currentTimer, 
            "previousTimer": self.previousTimer, 
            "loudness": EnumEventExceeded.LOUDNESS.value, 
            "currentLoudness": self.currentLoudness, 
            "previousLoudness": self.previousLoudness
        })
        pygame.event.post(new_event)

        for event in pygame.event.get():
            # global - Quit
            if event.type == pygame.QUIT:
                self.gameRunning = False

            elif event.type == pygame.MOUSEBUTTONDOWN:
                self.mousePressed = True
                self.mousePressedAt = pygame.mouse.get_pos()

            elif event.type == pygame.MOUSEBUTTONUP:
                # click on green flag event (Control 1)
                if(self.start_rect.collidepoint(mouse_x, mouse_y)):
                    self.restart_timer()
                    new_event = pygame.event.Event(EnumEventType.EVENT_START.value)
                    pygame.event.post(new_event)

                # when pressed on stop - global (cancels all scripts of all figures)
                if (self.stop_rect.collidepoint(mouse_x, mouse_y)):
                    new_event = pygame.event.Event(EnumEventType.EVENT_STOP.value)
                    pygame.event.post(new_event)

                # click on resize icon
                if (self.resize_rect.collidepoint(mouse_x, mouse_y)):
                    self.scale_factor_index = (self.scale_factor_index + 1) % len(self.scale_factors)
                    self.scale_factor = self.scale_factors[self.scale_factor_index]
                    self.scaled = not self.scaled
                    self.set_drawable_sizes()

                # when click on figure (Control 3)
                figure_clicked = False
                for drawableId in reversed(self.drawList[:]):
                    figure = self.drawListFigures[drawableId]
                    # check top-to-bottom
                    # if not visible or ghost set to 100, then it's not visible
                    if(not figure._isVisible or (EnumLooksEffect.GHOST in figure._currentLooksEffects.keys() and figure._currentLooksEffects[EnumLooksEffect.GHOST] == 100)):
                        continue
                    if(figure._intersect(mouse_x, mouse_y)):
                        image_rect, _ = figure._get_image_and_boudning_rect()
                        # Offset click position by figure's top-left corner
                        new_x = mouse_x - image_rect.left
                        new_y = mouse_y - image_rect.top
                        pixel_color = figure._current_costume().image.get_at((new_x, new_y))
                        if(pixel_color.a > 0):
                            new_event = pygame.event.Event(EnumEventType.EVENT_FIGURE_CLICKED.value, {"figureClickedId": figure._drawableId})
                            pygame.event.post(new_event)
                            figure_clicked = True
                            break
                
                # when click on stage (Control 3 - stage)
                if(not figure_clicked):
                    # If figure was not clicked then stage was clicked
                    stage_image_rect, _ = self.stage._get_image_and_boudning_rect()
                    if(stage_image_rect.collidepoint(mouse_x, mouse_y)):
                        new_event = pygame.event.Event(EnumEventType.EVENT_BACKDROP_CLICKED.value)
                        pygame.event.post(new_event)

            
            elif event.type == pygame.KEYDOWN:
                # on button press (Control 2)
                if(event.key in buttons.values()):
                    self.focused_key = event.key
                    self.key_press_time = pygame.time.get_ticks()
                    self.pressedKeys[event.key] = True
                    new_event = pygame.event.Event(EnumEventType.EVENT_BUTTON_PRESSED.value, {"buttonPressedId": self.focused_key})
                    pygame.event.post(new_event)
            
            elif event.type == pygame.KEYUP:
                if(event.key in buttons.values()):
                    self.pressedKeys[event.key] = False
                    # Clear the focused key if it's released
                    if event.key == self.focused_key:
                        self.focused_key = None
                        self.key_press_time = 0
            
            # Check if the key is still held down and handle repeating actions
            if self.focused_key is not None:
                current_time = pygame.time.get_ticks()  # Get the current time 
                if current_time - self.key_press_time > self.delay:
                    # Constantly trigger pressed events
                    new_event = pygame.event.Event(EnumEventType.EVENT_BUTTON_PRESSED.value, {"buttonPressedId": self.focused_key})
                    pygame.event.post(new_event)

            # pygame_gui specific events
            if event.type == pygame_gui.UI_TEXT_ENTRY_FINISHED:
                self.answerText = event.text
                self.answered = True
                self.isAsking = False

            if event.type in eventTypeValues:
                await self.eventSystem.dispatch_event(event.type, event)

            # Let pygame_gui handle its own events
            self.manager.process_events(event)
    
    def draw(self):
        """Draws targets and UI to the scene."""
        # Update pygame_gui
        self.manager.update(self.frameDuration)

        # Clear the screen
        self.window.fill(EnumColors.MAIN_BACKGROUND.value)

        # Draw main drawing window and its border
        pygame.draw.rect(self.window, EnumColors.BORDER.value, self.draw_window_border_rect)
        pygame.draw.rect(self.window, EnumColors.WHITE.value, self.draw_window_rect)

        # Set clipping
        self.window.set_clip(self.draw_window_rect)

        # Draw background
        backdrop_image_rect, _ = self.stage._get_image_and_boudning_rect()
        current_backdrop = self.stage._current_backdrop()
        self.window.blit(current_backdrop.image, backdrop_image_rect)

        # Draw images
        for drawableId in self.drawList[:]:
            figure = self.drawListFigures[drawableId]
            if(figure._isVisible):
                image_rect, bounding_rect = figure._get_image_and_boudning_rect()
                currentCostume = figure._current_costume()
                self.window.blit(currentCostume.image, image_rect)
                #pygame.draw.rect(self.window, (0, 255, 0), image_rect, 1)
                #pygame.draw.circle(self.window, (0, 255, 0), image_rect.center, 1)
                #pygame.draw.rect(self.window, (255, 0, 0), bounding_rect, 1)
                #pygame.draw.circle(self.window, (255, 0, 0), bounding_rect.center, 1)
                #pygame.draw.circle(self.window, (0, 0, 255), (figure._pos_x - currentCostume.rotation_center_x, figure._pos_y - currentCostume.rotation_center_y), 1)
                #sprite_x, sprite_y = figure._sprite_center()
                #pygame.draw.circle(self.window, (0, 0, 255), (figure._pos_x, figure._pos_y), 1)
                #pygame.draw.circle(self.window, (0, 255, 255), (figure._pos_x + sprite_x, figure._pos_y + sprite_y), 1)

                # Draw say or think bubble
                if(figure._speech and (figure._isSaying or figure._isThinking)):
                    self.draw_say_think_bubble(figure)

        # Draw visible variables and lists (first global then per sprite)
        self.draw_variables()
            
        # Remove clipping
        self.window.set_clip(None)

        self.draw_icons()

        # Draw the pygame_gui input box on top of other elements
        self.manager.draw_ui(self.window)

        # Update display
        pygame.display.flip()

    def check_loudness(self):
        """Checks loudness."""
        size = 2048
        sample_rate = 44100  # Common sampling rate

        # Start input stream, and stream until game stops running
        self.stream = sd.InputStream(samplerate=sample_rate, blocksize=size, channels=1, dtype='float32', callback=self.check_input_stream)
        self.stream.start()

    def check_input_stream(self, indata, frames, time, status):
        """Checks input stream."""
        # Calculate the RMS loudness of the audio data
        rms = self.calculate_rms(indata)
        self.previousLoudness = self.currentLoudness
        self.currentLoudness = rms

    def calculate_rms(self, data):
        """Calculates the correct loudness."""
        # Formulas and constants gotten from scratch-audio repository (https://github.com/scratchfoundation/scratch-audio/blob/develop/src/Loudness.js)
        # Flatten the audio data to a 1D array, if necessary
        data = np.squeeze(data)
        #return np.sqrt(np.mean(np.square(data)))
        sum = 0
        for i in range(0, len(data)):
            sum += math.pow(data[i], 2)
        rms = math.sqrt(sum / len(data))

        # smooth the value, if it is descending
        if(self.lastValue is not None):
            rms = max(rms, self.lastValue * 0.6)
        self.lastValue = rms

        # Scale the measurement so it's more sensitive to quieter sounds (1.63 original)
        rms *= 3.63
        rms = math.sqrt(rms)
        # Scale it up to 0-100 and round
        rms = round(rms * 100)
        # Prevent it from going above 100
        rms = min(rms, 100)
        return rms

    def stop_checking_loudness(self):
        """Stops checking loudness."""
        self.stream.stop()
        self.stream.close()

    def set_drawable_sizes(self):
        """Set the widths, heights variables and windows of pygame, after clicking the resize button."""
        # width and height of drawing window
        self.width = self.original_width * self.scale_factor
        self.height = self.original_height * self.scale_factor
        # width and height of the whole window
        self.main_width = self.width + self.left_margin + self.right_margin
        self.main_height = self.height + self.top_margin + self.bottom_margin
        # coordinates of start and end of drawing window
        self.left_border = self.left_margin
        self.right_border = self.left_margin + self.width
        self.top_border = self.top_margin
        self.bottom_border = self.top_margin + self.height
        # main window size
        self.window = pygame.display.set_mode((self.main_width, self.main_height), pygame.RESIZABLE)
        self.draw_window_rect = pygame.Rect(self.left_margin, self.top_margin, self.width, self.height) # this is also the clipping rectangle - outside this window, figures are clipped
        self.draw_window_border_rect = pygame.Rect(self.left_margin - self.draw_window_border_weight, self.top_margin - self.draw_window_border_weight, self.width + 2*self.draw_window_border_weight, self.height + 2*self.draw_window_border_weight)
        # set resize icon position
        self.resize_rect.topleft = (self.right_border - self.resize_rect.width, self.bottom_margin)
        # manager window size
        self.manager.set_window_resolution((self.main_width, self.main_height))
        # set sizes of backdrops
        self.stage._resize()
        # set sizes of figures
        for figure in self.figures[:]:
            figure._resize()

    def draw_variables(self):
        """Draws visible target variables and lists to screen."""
        # Remove drawn variables 
        for panel in self.var_panels:
            panel.kill()

        start_left = self.left_border + 5
        start_top = self.top_border + 5
        left_padding = 5
        top_padding = 5
        value_min_width = 40
        panel_top = start_top
        panel_rect_min_width = 120
        panel_rect_min_height = 200
        panel_rect_name_height = 30
        panel_rect_length_height = 30

        # Draw stage variables
        for id, data in self.stage._variables.items():
            value = str(data["value"])
            visible = data["visible"]
            name = self.stage._variables_names[id]
            if visible:
                font = self.manager.ui_theme.get_font(["#var_name_label"])
                name_width, font_height = font.size(name)
                value_width, value_height = font.size(value)
                if value_width < value_min_width:
                    value_width = value_min_width
                panel_rect_width = name_width + value_width + left_padding + left_padding + left_padding + 2 + 2
                panel_rect_height = font_height + top_padding + top_padding
                rect = pygame.Rect(start_left, panel_top, panel_rect_width, panel_rect_height)
                panel = pygame_gui.elements.UIPanel(rect, manager=self.manager, object_id="#var_panel")
                label_rect_name = pygame.Rect(left_padding, top_padding, name_width, font_height) # relative to panel
                label_name = pygame_gui.elements.UILabel(label_rect_name, name, manager=self.manager, container=panel, object_id="#var_name_label")
                label_rect_value = pygame.Rect(left_padding + name_width + left_padding, top_padding, value_width + 2 + 2, value_height) # relative to panel
                label_value = pygame_gui.elements.UILabel(label_rect_value, value, manager=self.manager, container=panel, object_id="#var_value_label")
                self.var_panels.append(panel)
                panel_top += panel_rect_height + top_padding

        # Draw stage list variables
        for id, data in self.stage._lists.items():
            list1 = data["value"]
            visible = data["visible"]
            name = self.stage._variables_names[id]
            if visible:
                panel_rect_width = 0
                panel_rect_height = panel_rect_name_height + panel_rect_length_height

                for i in range(len(list1)):
                    value = str(list1[i])
                    index = str(i + 1)
                    font = self.manager.ui_theme.get_font(["#var_name_label"])
                    index_width, font_height = font.size(index)
                    value_width, value_height = font.size(value)

                    panel_rect_width_item = index_width + value_width + left_padding + left_padding + left_padding + 2 + 2
                    panel_rect_height_item = font_height + top_padding

                    if(panel_rect_width_item > panel_rect_width):
                        panel_rect_width = panel_rect_width_item
                    panel_rect_height += panel_rect_height_item

                if(panel_rect_width < panel_rect_min_width):
                    panel_rect_width = panel_rect_min_width
                if(panel_rect_height + panel_rect_name_height + panel_rect_length_height < panel_rect_min_height):
                    panel_rect_height = panel_rect_min_height

                panel_rect_content_height = panel_rect_height - panel_rect_name_height - panel_rect_length_height

                rect_panel_list = pygame.Rect(start_left, panel_top, panel_rect_width, panel_rect_height)
                panel_list = pygame_gui.elements.UIPanel(rect_panel_list, manager=self.manager, object_id="#var_panel")

                rect_panel_name = pygame.Rect(0, 0, panel_rect_width, panel_rect_name_height)
                panel_name = pygame_gui.elements.UIPanel(rect_panel_name, manager=self.manager, container=panel_list, object_id="#var_panel_name")

                rect_label_name = pygame.Rect(left_padding, top_padding, panel_rect_width - left_padding - left_padding, panel_rect_name_height - top_padding - top_padding)
                label_name = pygame_gui.elements.UILabel(rect_label_name, name, manager=self.manager, container=panel_name, object_id="#list_name_label")

                rect_panel_content = pygame.Rect(0, panel_rect_name_height, panel_rect_width, panel_rect_content_height)
                panel_content = pygame_gui.elements.UIPanel(rect_panel_content, manager=self.manager, container=panel_list, object_id="#list_content_panel")

                self.var_panels.append(panel_list)
                panel_top += panel_rect_height + top_padding

                panel_top_item = 0
                for i in range(len(list1)):
                    value = str(list1[i])
                    index = str(i + 1)
                    font = self.manager.ui_theme.get_font(["#var_name_label"])
                    index_width, font_height = font.size(index)
                    value_width, value_height = font.size(value)

                    panel_rect_height_item = font_height + top_padding

                    rect = pygame.Rect(0 + 2, panel_top_item, panel_rect_width, panel_rect_height_item)
                    panel = pygame_gui.elements.UIPanel(rect, manager=self.manager, container=panel_content, object_id="#list_panel_item")

                    value_width_label = panel_rect_width - left_padding - index_width - left_padding - left_padding
                    label_rect_name = pygame.Rect(left_padding, top_padding, index_width, font_height) # relative to panel
                    label_name = pygame_gui.elements.UILabel(label_rect_name, index, manager=self.manager, container=panel, object_id="#var_name_label")
                    label_rect_value = pygame.Rect(left_padding + index_width + left_padding, top_padding, value_width_label, value_height) # relative to panel
                    label_value = pygame_gui.elements.UILabel(label_rect_value, value, manager=self.manager, container=panel, object_id="#list_value_label")

                    panel_top_item += panel_rect_height_item

                rect_panel_length = pygame.Rect(0, panel_rect_name_height + panel_rect_content_height, panel_rect_width, panel_rect_length_height)
                panel_length = pygame_gui.elements.UIPanel(rect_panel_length, manager=self.manager, container=panel_list, object_id="#var_panel_length")

                rect_label_length = pygame.Rect(left_padding, top_padding, panel_rect_width - left_padding - left_padding, panel_rect_length_height - top_padding - top_padding)
                label_length = pygame_gui.elements.UILabel(rect_label_length, "dolžina " + str(len(list1)), manager=self.manager, container=panel_length, object_id="#list_name_label")

        # Draw figure variables
        for figure in self.figures[:]:
            for id, data in figure._variables.items():
                name = figure._variables_names[id]
                name = figure._name + ": " + name
                value = str(data["value"])
                visible = data["visible"]
                if visible:
                    font = self.manager.ui_theme.get_font(["#var_name_label"])
                    name_width, font_height = font.size(name)
                    value_width, value_height = font.size(value)
                    if value_width < value_min_width:
                        value_width = value_min_width
                    panel_rect_width = name_width + value_width + left_padding + left_padding + left_padding + 2 + 2
                    panel_rect_height = font_height + top_padding + top_padding
                    rect = pygame.Rect(start_left, panel_top, panel_rect_width, panel_rect_height)
                    panel = pygame_gui.elements.UIPanel(rect, manager=self.manager, object_id="#var_panel")
                    label_rect_name = pygame.Rect(left_padding, top_padding, name_width, font_height) # relative to panel
                    label_name = pygame_gui.elements.UILabel(label_rect_name, name, manager=self.manager, container=panel, object_id="#var_name_label")
                    label_rect_value = pygame.Rect(left_padding + name_width + left_padding, top_padding, value_width + 2 + 2, value_height) # relative to panel
                    label_value = pygame_gui.elements.UILabel(label_rect_value, value, manager=self.manager, container=panel, object_id="#var_value_label")
                    self.var_panels.append(panel)
                    panel_top += panel_rect_height + top_padding

        # Draw figure list variables
        for figure in self.figures[:]:
            for id, data in figure._lists.items():
                name = figure._variables_names[id]
                name = figure._name + ": " + name
                list1 = data["value"]
                visible = data["visible"]
                if visible:
                    panel_rect_width = 0
                    panel_rect_height = panel_rect_name_height + panel_rect_length_height

                    for i in range(len(list1)):
                        value = str(list1[i])
                        index = str(i + 1)
                        font = self.manager.ui_theme.get_font(["#var_name_label"])
                        index_width, font_height = font.size(index)
                        value_width, value_height = font.size(value)

                        panel_rect_width_item = index_width + value_width + left_padding + left_padding + left_padding + 2 + 2
                        panel_rect_height_item = font_height + top_padding

                        if(panel_rect_width_item > panel_rect_width):
                            panel_rect_width = panel_rect_width_item
                        panel_rect_height += panel_rect_height_item

                    if(panel_rect_width < panel_rect_min_width):
                        panel_rect_width = panel_rect_min_width
                    if(panel_rect_height + panel_rect_name_height + panel_rect_length_height < panel_rect_min_height):
                        panel_rect_height = panel_rect_min_height

                    panel_rect_content_height = panel_rect_height - panel_rect_name_height - panel_rect_length_height

                    rect_panel_list = pygame.Rect(start_left, panel_top, panel_rect_width, panel_rect_height)
                    panel_list = pygame_gui.elements.UIPanel(rect_panel_list, manager=self.manager, object_id="#var_panel")

                    rect_panel_name = pygame.Rect(0, 0, panel_rect_width, panel_rect_name_height)
                    panel_name = pygame_gui.elements.UIPanel(rect_panel_name, manager=self.manager, container=panel_list, object_id="#var_panel_name")

                    rect_label_name = pygame.Rect(left_padding, top_padding, panel_rect_width - left_padding - left_padding, panel_rect_name_height - top_padding - top_padding)
                    label_name = pygame_gui.elements.UILabel(rect_label_name, name, manager=self.manager, container=panel_name, object_id="#list_name_label")

                    rect_panel_content = pygame.Rect(0, panel_rect_name_height, panel_rect_width, panel_rect_content_height)
                    panel_content = pygame_gui.elements.UIPanel(rect_panel_content, manager=self.manager, container=panel_list, object_id="#list_content_panel")

                    self.var_panels.append(panel_list)
                    panel_top += panel_rect_height + top_padding

                    panel_top_item = 0
                    for i in range(len(list1)):
                        value = str(list1[i])
                        index = str(i + 1)
                        font = self.manager.ui_theme.get_font(["#var_name_label"])
                        index_width, font_height = font.size(index)
                        value_width, value_height = font.size(value)

                        panel_rect_height_item = font_height + top_padding

                        rect = pygame.Rect(0 + 2, panel_top_item, panel_rect_width, panel_rect_height_item)
                        panel = pygame_gui.elements.UIPanel(rect, manager=self.manager, container=panel_content, object_id="#list_panel_item")

                        value_width_label = panel_rect_width - left_padding - index_width - left_padding - left_padding
                        label_rect_name = pygame.Rect(left_padding, top_padding, index_width, font_height) # relative to panel
                        label_name = pygame_gui.elements.UILabel(label_rect_name, index, manager=self.manager, container=panel, object_id="#var_name_label")
                        label_rect_value = pygame.Rect(left_padding + index_width + left_padding, top_padding, value_width_label, value_height) # relative to panel
                        label_value = pygame_gui.elements.UILabel(label_rect_value, value, manager=self.manager, container=panel, object_id="#list_value_label")

                        panel_top_item += panel_rect_height_item

                    rect_panel_length = pygame.Rect(0, panel_rect_name_height + panel_rect_content_height, panel_rect_width, panel_rect_length_height)
                    panel_length = pygame_gui.elements.UIPanel(rect_panel_length, manager=self.manager, container=panel_list, object_id="#var_panel_length")

                    rect_label_length = pygame.Rect(left_padding, top_padding, panel_rect_width - left_padding - left_padding, panel_rect_length_height - top_padding - top_padding)
                    label_length = pygame_gui.elements.UILabel(rect_label_length, "dolžina " + str(len(list1)), manager=self.manager, container=panel_length, object_id="#list_name_label")

    def draw_icons(self):
        """Draws start, stop and resize icons."""
        # Start icon
        rect_x, rect_y = self.start_rect.topleft
        rect_width, rect_height = self.start_rect.size

        START_BORDER_COLOR = (69, 153, 61)
        START_INNER_COLOR = (76, 191, 86)
        STOP_BORDER_COLOR = (184, 72, 72)
        STOP_INNER_COLOR = (236, 89, 89)
        ARROW_COLOR = (87, 94, 117)

        # Highlighting buttons when hover with mouse
        mouse_x, mouse_y = pygame.mouse.get_pos()
        if(self.start_rect.collidepoint(mouse_x, mouse_y)):
            # Start
            pygame.draw.rect(self.window, EnumColors.BORDER.value, self.start_rect)
        if (self.stop_rect.collidepoint(mouse_x, mouse_y)):
            # Stop
            pygame.draw.rect(self.window, EnumColors.BORDER.value, self.stop_rect)
        if (self.resize_rect.collidepoint(mouse_x, mouse_y)):
            # Resize
            pygame.draw.rect(self.window, EnumColors.BORDER.value, self.resize_rect)

        pole_x = rect_x + 5
        pole_y = rect_y + 5
        pole_w = 3
        pole_h = rect_height - 10
        pole_rect = pygame.Rect(pole_x, pole_y, pole_w, pole_h)

        flag_outer_x = pole_x + pole_w - 1
        flag_outer_y = pole_y
        flag_outer_w = rect_width - pole_w - 10
        flag_outer_h = 2 * pole_h / 3
        flag_outer_rect = pygame.Rect(flag_outer_x, flag_outer_y, flag_outer_w, flag_outer_h)

        flag_inner_x = flag_outer_x + 1
        flag_inner_y = flag_outer_y + 1
        flag_inner_w = flag_outer_w - 2
        flag_inner_h = flag_outer_h - 2
        flag_inner_rect = pygame.Rect(flag_inner_x, flag_inner_y, flag_inner_w, flag_inner_h)

        pygame.draw.rect(self.window, START_BORDER_COLOR, pole_rect)
        pygame.draw.rect(self.window, START_BORDER_COLOR, flag_outer_rect)
        pygame.draw.rect(self.window, START_INNER_COLOR, flag_inner_rect)

        # Stop icon
        rect_x, rect_y = self.stop_rect.topleft
        rect_width, rect_height = self.stop_rect.size

        rect_x = rect_x + 5
        rect_y = rect_y + 5
        rect_width = rect_width - 10
        
        length = rect_width / 3
        stop_outer_points = [
            (rect_x + 1*length - 1, rect_y), 
            (rect_x + 2*length + 1, rect_y),
            (rect_x + 3*length, rect_y + 1*length - 1),
            (rect_x + 3*length, rect_y + 2*length + 1),
            (rect_x + 2*length + 1, rect_y + 3*length),
            (rect_x + 1*length - 1, rect_y + 3*length),
            (rect_x, rect_y + 2*length + 1),
            (rect_x, rect_y + 1*length - 1)
        ]
        stop_inner_points = [
            (rect_x + 1*length - 1, rect_y + 1), 
            (rect_x + 2*length + 1, rect_y + 1),
            (rect_x + 3*length - 1, rect_y + 1*length - 1),
            (rect_x + 3*length - 1, rect_y + 2*length + 1),
            (rect_x + 2*length + 1, rect_y + 3*length - 1),
            (rect_x + 1*length - 1, rect_y + 3*length - 1),
            (rect_x + 1, rect_y + 2*length + 1),
            (rect_x + 1, rect_y + 1*length - 1)
        ]

        pygame.draw.polygon(self.window, STOP_BORDER_COLOR, stop_outer_points)
        pygame.draw.polygon(self.window, STOP_INNER_COLOR, stop_inner_points)

        # Resize
        rect_topleft_x, rect_topleft_y = self.resize_rect.topleft
        rect_topright_x, rect_topright_y = self.resize_rect.topright
        rect_bottomleft_x, rect_bottomleft_y = self.resize_rect.bottomleft
        rect_bottomright_x, rect_bottomright_y = self.resize_rect.bottomright
        rect_width, rect_height = self.stop_rect.size
        rect_center_x, rect_center_y = self.resize_rect.center

        rect_topleft_x, rect_topleft_y = rect_topleft_x + 5, rect_topleft_y + 5
        rect_topright_x, rect_topright_y = rect_topright_x - 5, rect_topright_y + 5
        rect_bottomleft_x, rect_bottomleft_y = rect_bottomleft_x + 5, rect_bottomleft_y - 5
        rect_bottomright_x, rect_bottomright_y = rect_bottomright_x - 5, rect_bottomright_y - 5
        rect_width = rect_width - 10
        rect_height = rect_height - 10

        length = rect_width / 3

        lines = [
            [(rect_center_x - 2, rect_center_y - 2), (rect_topleft_x, rect_topleft_y)],
            [(rect_center_x + 2, rect_center_y - 2), (rect_topright_x, rect_topright_y)],
            [(rect_center_x + 2, rect_center_y + 2), (rect_bottomright_x, rect_bottomright_y)],
            [(rect_center_x - 2, rect_center_y + 2), (rect_bottomleft_x, rect_bottomleft_y)]
        ]
        arrows = []

        if(self.scaled):
            # Arrows pointing inwards
            arrows = [
                [
                    (rect_center_x - 2, rect_center_y - 2),
                    (rect_center_x - 2, rect_center_y - 2 - length),
                    (rect_center_x - 2 - length, rect_center_y - 2)
                ],
                [
                    (rect_center_x + 2, rect_center_y - 2),
                    (rect_center_x + 2 + length, rect_center_y - 2),
                    (rect_center_x + 2, rect_center_y - 2 - length)
                ],
                [
                    (rect_center_x + 2, rect_center_y + 2),
                    (rect_center_x + 2, rect_center_y + 2 + length),
                    (rect_center_x + 2 + length, rect_center_y + 2)
                ],
                [
                    (rect_center_x - 2, rect_center_y + 2),
                    (rect_center_x - 2 - length, rect_center_y + 2),
                    (rect_center_x - 2, rect_center_y + 2 + length)
                ]
            ]
        else:
            # Arrows pointing outwards
            arrows = [
                [
                    (rect_topleft_x, rect_topleft_y),
                    (rect_topleft_x + length, rect_topleft_y),
                    (rect_topleft_x, rect_topleft_y + length)
                ],
                [
                    (rect_topright_x, rect_topright_y),
                    (rect_topright_x, rect_topright_y + length),
                    (rect_topright_x - length, rect_topright_y)
                ],
                [
                    (rect_bottomright_x, rect_bottomright_y),
                    (rect_bottomright_x - length, rect_bottomright_y),
                    (rect_bottomright_x, rect_bottomright_y - length)
                ],
                [
                    (rect_bottomleft_x, rect_bottomleft_y),
                    (rect_bottomleft_x, rect_bottomleft_y - length),
                    (rect_bottomleft_x + length, rect_bottomleft_y)
                ]
            ]

        for line in lines:
            pygame.draw.line(self.window, ARROW_COLOR, line[0], line[1], 3)

        for arrow in arrows:
            pygame.draw.polygon(self.window, ARROW_COLOR, arrow)

    def draw_say_think_bubble(self, figure):
        """Draws say or think bubbles above sprites."""
        figure: Figure = figure
        image_rect, bounding_rect = figure._get_image_and_boudning_rect()

        BORDER_COLOR = (180, 191, 214)
        BUBBLE_COLOR = (255, 255, 255)
        FONT_COLOR = (87, 94, 117)

        bubble_min_width = 80 * self.scale_factor
        bubble_max_width = 210 * self.scale_factor
        bubble_padding_width = 15 * self.scale_factor
        bubble_padding_height = 15 * self.scale_factor
        text_line_spacing = 5 * self.scale_factor
        bubble_border_thickness = 2 * self.scale_factor

        font = pygame.freetype.SysFont("Tahoma", 15 * self.scale_factor) # "Arial", 16 ali privzet: None, 16

        figure_center = bounding_rect.center
        figure_size = bounding_rect.size

        outer_triangle_size = 20 * self.scale_factor
        outer_circle_radius = outer_triangle_size / 2

        # 1. Split speech/text into lines, so it is within max with of the bubble
        words = figure._speech.split(' ')
        lines = []
        current_line = ""
        for word in words:
            # Try adding the word to the current line
            test_line = current_line + word + " "
            text_surface, _ = font.render(test_line, FONT_COLOR)
            text_width, _ = text_surface.get_size()
            # If the line exceeds the max width + padding, move the current line to lines
            if text_width > bubble_max_width - 2 * bubble_padding_width and current_line:
                lines.append(current_line.strip())
                current_line = word + " "  # Start a new line
            else:
                current_line = test_line
        # Append any remaining text in the current line
        if current_line:
            lines.append(current_line.strip())

        # 2. Get and set sizes of text and bubbles
        # Get the size of the longest line
        text_surfaces = [font.render(line, FONT_COLOR)[0] for line in lines]
        text_width = max([surface.get_width() for surface in text_surfaces])
        text_height = sum([surface.get_height() + text_line_spacing for surface in text_surfaces])
        text_height -= text_line_spacing # remove last line_spacing

        inner_bubble_width = text_width + bubble_padding_width * 2
        inner_bubble_height = text_height + bubble_padding_height * 2

        if(text_width < bubble_min_width - bubble_padding_width * 2):
            inner_bubble_width = bubble_min_width

        outer_bubble_width = inner_bubble_width + bubble_border_thickness * 2
        outer_bubble_height = inner_bubble_height + bubble_border_thickness * 2

        outer_bubble_left = figure_center[0] - outer_bubble_width/2 - bubble_border_thickness
        outer_bubble_top = figure_center[1] - figure_size[1]/2 - outer_bubble_height - bubble_border_thickness - outer_triangle_size

        # If bubble outside window, constrain it within window
        if outer_bubble_left < self.left_border:
            outer_bubble_left = self.left_border
        elif outer_bubble_left + outer_bubble_width > self.right_border:
            outer_bubble_left = self.right_border - outer_bubble_width
        if outer_bubble_top < self.top_border:
            outer_bubble_top = self.top_border
        elif outer_bubble_top + outer_bubble_height + outer_triangle_size > self.bottom_border:
            outer_bubble_top = self.bottom_border - outer_bubble_height - outer_triangle_size

        inner_bubble_left = outer_bubble_left + bubble_border_thickness
        inner_bubble_top = outer_bubble_top + bubble_border_thickness

        # Set rect of outer bubble (border) and inner bubble
        outer_bubble_rect = pygame.Rect(outer_bubble_left, outer_bubble_top, outer_bubble_width, outer_bubble_height)
        inner_bubble_rect = pygame.Rect(inner_bubble_left, inner_bubble_top, inner_bubble_width, inner_bubble_height)

        # Draw bubbles
        pygame.draw.rect(self.window, BORDER_COLOR, outer_bubble_rect, border_radius=int(20 * self.scale_factor))
        pygame.draw.rect(self.window, BUBBLE_COLOR, inner_bubble_rect, border_radius=int(20 * self.scale_factor - bubble_border_thickness))

        inner_bubble_center_x = inner_bubble_rect.centerx
        inner_bubble_center_y = inner_bubble_rect.centery

        # 3. Draw additional shapes based on if it's saying or thinking
        if(figure._isSaying):
            # Draw saying arrow
            triangle_height = outer_triangle_size * math.sqrt(3) / 2

            outer_top_left = (inner_bubble_center_x - outer_triangle_size/2, inner_bubble_center_y + outer_bubble_rect.height/2 - bubble_border_thickness/2)
            outer_top_right = (inner_bubble_center_x + outer_triangle_size/2, inner_bubble_center_y + outer_bubble_rect.height/2 - bubble_border_thickness/2)
            outer_bottom = (inner_bubble_center_x, inner_bubble_center_y + outer_bubble_rect.height/2 + triangle_height)

            inner_top_left = (outer_top_left[0] + bubble_border_thickness, outer_top_left[1] - (2 if self.scaled else 0))
            inner_top_right = (outer_top_right[0] - bubble_border_thickness, outer_top_left[1] - (2 if self.scaled else 0))
            inner_bottom = (outer_bottom[0], outer_bottom[1] - bubble_border_thickness * 2)

            outer_triangle_vertices = [outer_top_left, outer_top_right, outer_bottom]
            inner_triangle_vertices = [inner_top_left, inner_top_right, inner_bottom]

            # Draw outer and inner triangle
            pygame.draw.polygon(self.window, BORDER_COLOR, outer_triangle_vertices)
            pygame.draw.polygon(self.window, BUBBLE_COLOR, inner_triangle_vertices)    

        elif(figure._isThinking):
            # Draw thinking mini bubbles
            outer_circle = (inner_bubble_center_x, inner_bubble_center_y + outer_bubble_rect.height/2 - bubble_border_thickness/2 - (2 if self.scaled else 0))
            inner_circle = outer_circle

            outer_lower_circle = (outer_circle[0], outer_circle[1] + outer_circle_radius*2 - outer_circle_radius/4)
            inner_lower_circle = (outer_lower_circle[0], outer_lower_circle[1])

            # Draw circles
            pygame.draw.circle(self.window, BORDER_COLOR, outer_circle, outer_circle_radius, draw_bottom_left=True, draw_bottom_right=True)
            pygame.draw.circle(self.window, BUBBLE_COLOR, inner_circle, outer_circle_radius - bubble_border_thickness, draw_bottom_left=True, draw_bottom_right=True)
            pygame.draw.circle(self.window, BORDER_COLOR, outer_lower_circle, outer_circle_radius/2)
            pygame.draw.circle(self.window, BUBBLE_COLOR, inner_lower_circle, outer_circle_radius/2 - bubble_border_thickness)

        # Draw text
        y_offset = inner_bubble_top + bubble_padding_height
        for surface in text_surfaces:
            self.window.blit(surface, (inner_bubble_left + bubble_padding_width, y_offset))
            y_offset += surface.get_height() + text_line_spacing
    
    def add_clone(self, clone_creator, clone):
        """Adds a clone to draw list, figures and subscribers."""
        clone_creator: Figure = clone_creator
        clone: Figure = clone
        drawableId_position = self.drawList.index(clone_creator._drawableId)
        self.figures.append(clone)
        self.subscribers[clone] = clone._scripts
        self.drawList.insert(drawableId_position, clone._drawableId)
        self.drawListFigures[clone._drawableId] = clone

    def remove_clone(self, drawableId, sprite):
        """Removes a clone from draw list, figures and subscribers."""
        if drawableId in self.drawList:
            self.drawList.remove(drawableId)
        if drawableId in self.drawListFigures.keys():
            self.drawListFigures.pop(drawableId)
        if sprite in self.subscribers.keys():
            self.subscribers.pop(sprite)
        if sprite in self.figures:
            self.figures.remove(sprite)

    def upload_files(self, stageBackdropNames, currentBackdropIndex, stageBackdropRotationCenters, stageSoundNames, stageSoundVolume):
        """Uploads backdrops, sounds files for stage and sprites, based on the names."""
        stageBackdropFiles =  {}
        for name in stageBackdropNames:
            stageBackdropFiles[name] = ""

        stageSoundFiles =  {}
        for name in stageSoundNames:
            stageSoundFiles[name] = ""

        spriteFiles = {}
        for figure in self.figures:
            spriteFiles[figure._name] = ""

        background_color = "#e6f0ff"
        root = tk.Tk()
        root.title("Izbira datotek")
        root.geometry("500x550")
        root.config(bg=background_color)

        remaining_backdrops = ""
        remaining_sounds = ""
        remaining_sprites = ""
        
        def close_dialog():
            root.destroy()
            sys.exit()

        def select_folder():
            background_suffixes = ['.png', '.svg']
            sound_suffixes = ['.mp3', '.wav']
            sprite_suffixes = ['.sprite3']
            directory = filedialog.askdirectory(title="Izberite mapo")
            if directory:
                path = Path(directory)
                if path.is_dir():
                    for item in path.iterdir():
                        if item.is_file():
                            name = item.stem
                            full_name = item.name
                            if name in stageBackdropFiles and not stageBackdropFiles[name] and item.suffix in background_suffixes:
                                stageBackdropFiles[name] = (path/full_name).as_posix()
                            elif name in stageSoundFiles and not stageSoundFiles[name] and item.suffix in sound_suffixes:
                                stageSoundFiles[name] = (path/full_name).as_posix()
                            elif name in spriteFiles and not spriteFiles[name] and item.suffix in sprite_suffixes:
                                spriteFiles[name] = (path/full_name).as_posix()
            check_files()

        def select_individual():
            window_closed = False
            for name in stageBackdropNames:
                if not stageBackdropFiles[name]:
                    file_path = filedialog.askopenfilename(
                        title="Izberite datoteko za ozadje odra: '{name}'".format(name=name),
                        filetypes=[("Slikovne daoteke", "*.png;*.svg;")]
                    )
                    if file_path:
                        stageBackdropFiles[name] = file_path
                    else:
                        # Window closed by pressing cancel or X - don't open it again
                        window_closed = True
                        break

            for name in stageSoundNames:
                if not window_closed and not stageSoundFiles[name]:
                    file_path = filedialog.askopenfilename(
                        title="Izberite datoteko za zvok odra: '{name}'".format(name=name),
                        filetypes=[("Zvočne datoteke", "*.wav;*.mp3;")]
                    )
                    if file_path:
                        stageSoundFiles[name] = file_path
                    else:
                        window_closed = True
                        break
            
            for figure in self.figures:
                name = figure._name
                if not window_closed and not spriteFiles[name]:
                    file_path = filedialog.askopenfilename(
                        title="Izberite datoteko za figuro: '{name}'".format(name=name),
                        filetypes=[("Datoteke figur Scratch", "*.sprite3")]
                    )
                    if file_path:
                        spriteFiles[name] = file_path
                    else:
                        window_closed = True
                        break
            check_files()
            

        def check_files():
            nonlocal remaining_backdrops, remaining_sounds, remaining_sprites
            remaining_backdrops = ""
            remaining_sounds = ""
            remaining_sprites = ""
            all_files = True

            for name in stageBackdropNames:
                if not stageBackdropFiles[name]:
                    remaining_backdrops = remaining_backdrops + name + ", "
                    all_files = False
            if remaining_backdrops:
                remaining_backdrops = remaining_backdrops[:-2] # remove last "," and " "

            for name in stageSoundNames:
                if not stageSoundFiles[name]:
                    remaining_sounds = remaining_sounds + name + ", "
                    all_files = False
            if remaining_sounds:
                remaining_sounds = remaining_sounds[:-2] # remove last "," and " "

            for figure in self.figures:
                name = figure._name
                if not spriteFiles[name]:
                    remaining_sprites = remaining_sprites + name + ", "
                    all_files = False
            if remaining_sprites:
                remaining_sprites = remaining_sprites[:-2] # remove last "," and " "

            label_remaining_backdrops.config(text="Preostala ozadja odra: " + remaining_backdrops)
            label_remaining_sounds.config(text="Preostali zvoki odra: " + remaining_sounds)
            label_remaining_sprites.config(text="Preostale figure: " + remaining_sprites)

            if all_files:
                set_stage_backdrops()
                set_stage_sounds()
                set_sprites()
                root.destroy()

        def set_stage_backdrops():
            id = 0
            for name in stageBackdropNames:
                file_path = stageBackdropFiles[name]
                # Check if a image was selected
                if file_path:
                    # If image exists, create Backdrop
                    backdropImage = pygame.image.load(file_path)
                    # Set the rotation center
                    current_bitmap_resolution = 1
                    current_backdrop_rot_cent_x = 0
                    current_backdrop_rot_cent_y = 0
                    for (backdrop_name, rot_cent_x, rot_cent_y, bitmap_resolution) in stageBackdropRotationCenters:
                        if backdrop_name == name:
                            current_bitmap_resolution = bitmap_resolution
                            current_backdrop_rot_cent_x = rot_cent_x
                            current_backdrop_rot_cent_y = rot_cent_y
                    new_image = Image(id, name, backdropImage, current_backdrop_rot_cent_x, current_backdrop_rot_cent_y, current_bitmap_resolution)
                    self.stage._backdrops[name] = new_image
                else:
                    print("Nobena slika ni bila izbrana, prosimo izberite sliko za ozadje odra.")
                id += 1
            
            self.stage._backdropNames = stageBackdropNames
            self.stage._currentBackdropName = stageBackdropNames[currentBackdropIndex]

        def set_stage_sounds():
            for name in stageSoundNames:
                file_path = stageSoundFiles[name]
                # Check if audio was selected
                if file_path:
                    # If audio file exists, create Sound
                    soundReal = pygame.mixer.Sound(file_path)
                    new_sound = Sound(self.stage, name, soundReal)
                    self.stage._sounds[name] = new_sound
                    self.stage._soundNames.append(name)
                else:
                    print("Noben zvok ni bil izbran, prosimo izberite zvok za oder.")
            self.stage._soundsVolume = stageSoundVolume / 100

        def set_sprites():
            for figure in self.figures:
                figName = figure._name
                file_path = spriteFiles[figName]
                if(file_path):
                    file_data = {}
                    with open(file_path, 'rb') as f:
                        with zipfile.ZipFile(f, 'r') as zip_ref:
                            # this includes costumes and sounds! + other things
                            file_data = {name: zip_ref.read(name) for name in zip_ref.namelist()}
                    sprite_json = json.loads(file_data['sprite.json'].decode('utf-8'))
                    costumeNames = []
                    id = 0
                    # create costumes
                    for costume in sprite_json['costumes']:
                        costumeName = costume['name']
                        costumePath = costume['md5ext']
                        costumeRotationCenterX = costume['rotationCenterX']
                        costumeRotationCenterY = costume['rotationCenterY']
                        bitmapResolution = costume['bitmapResolution']
                        svgImage = file_data[costumePath]
                        # Because of this conversion from svg to png, which rounds width and height, we might get some small errors when calculating positions
                        image = pygame.Surface((0,0))
                        try:
                            image = pygame.image.load(BytesIO(svgImage))
                        except Exception as e:
                            print("Warning:", e, "("+figName+", "+costumeName+"), applying default.")
                        new_costume = Image(id, costumeName, image, float(costumeRotationCenterX), float(costumeRotationCenterY), bitmapResolution)
                        figure._costumes[costumeName] = new_costume
                        costumeNames.append(costumeName)
                        id += 1
                    currentCostumeIndx = sprite_json['currentCostume']
                    currentCostumeName = sprite_json['costumes'][currentCostumeIndx]['name']
                    figure._costumeNames = costumeNames
                    figure._currentCostumeName = currentCostumeName

                    # create sounds
                    for sound in sprite_json['sounds']:
                        soundName = sound['name']
                        soundPath = sound['md5ext']
                        soundFile = file_data[soundPath]
                        soundReal = pygame.mixer.Sound(BytesIO(soundFile))
                        new_sound = Sound(figure, soundName, soundReal)
                        figure._sounds[soundName] = new_sound
                        figure._soundNames.append(soundName)
                    figure._soundsVolume = float(sprite_json['volume']) / 100
                else:
                    print("Nobena figura ni bila izbrana, prosimo izberite figuro.")

        labels_frame = tk.Frame(root, bg=background_color)
        labels_frame.pack(side=tk.TOP, pady=10, padx=10, fill=tk.BOTH)

        labels_title_desc_frame = tk.Frame(labels_frame, bg=background_color)
        labels_title_desc_frame.pack(side=tk.TOP, fill=tk.X)

        labels_remaining_files_frame = tk.Frame(labels_frame, bg=background_color)
        labels_remaining_files_frame.pack(side=tk.BOTTOM, fill=tk.X)

        label_title = tk.Label(labels_title_desc_frame, text="Izbira datotek za skripto", bg=background_color, font=(14), justify="center")
        label_title.pack(side=tk.TOP, fill=tk.X)

        # List of text for labels
        label_texts = [
            "Izberite spodnje datoteke za figure, ozadja odra ter zvoke odra za skripto.",
            "Sprejete vrste datotek za figure: .sprite3",
            "Sprejete vrste datotek za ozadja odra: .png, .svg",
            "Sprejete vrste datotek za zvoke odra: .mp3, .wav",
            "Za nalaganje datotek lahko izberete posamezne datoteke ali mapo, ki že vsebuje vse potrebne datoteke. Če izberete mapo, morajo biti imena datotek enaka tistim v okolju Scratch.",
            "(Datoteke za figure lahko prenesete iz okolja Scratch tako, da v izbirnem polju figur z desnim miškinim gumbom kliknete na željeno figuro in kliknete 'izvozi'. "
            "Datoteke za ozadja in zvoke odra lahko prenesete tako, da kliknete na oder ter v levem zgornjem kotu izberete 'Ozadja' oziroma 'Zvoki', ter izvozite datoteke na enak način.)"
        ]

        # Add labels to the frame
        for i in range(len(label_texts)):
            pady = (15, 0)
            if i in [2, 3]:
                pady = (0, 0)
            label_desc = tk.Label(labels_title_desc_frame, anchor=tk.W, bg=background_color, text=label_texts[i], wraplength=500-2*10, justify='left')
            label_desc.pack(side=tk.TOP, anchor=tk.W, fill=tk.X, pady=pady)  # Align to left and add vertical space

        label_remaining_backdrops = tk.Label(labels_remaining_files_frame, anchor=tk.W, font=("Segoe UI", 9, "bold"), bg=background_color, text="Preostala ozadja odra: " + remaining_backdrops, wraplength=500-2*10, justify='left')
        label_remaining_backdrops.pack(side=tk.TOP, anchor=tk.W, fill=tk.X, pady=(15, 0))

        label_remaining_sounds = tk.Label(labels_remaining_files_frame, anchor=tk.W, font=("Segoe UI", 9, "bold"), bg=background_color, text="Preostali zvoki odra: " + remaining_sounds, wraplength=500-2*10, justify='left')
        label_remaining_sounds.pack(side=tk.TOP, anchor=tk.W, fill=tk.X, pady=(0, 0))

        label_remaining_sprites = tk.Label(labels_remaining_files_frame, anchor=tk.W, font=("Segoe UI", 9, "bold"), bg=background_color, text="Preostale figure: " + remaining_sprites, wraplength=500-2*10, justify='left')
        label_remaining_sprites.pack(side=tk.TOP, anchor=tk.W, fill=tk.X, pady=(0, 0))

        check_files()

        # pady=10 -> padds top and bottom by 10, pady=(20,10) -> padds top by 20 and bottom by 10
        # padx=10 -> padds left and right by 10, padx=(20,10) -> padds left by 20 and right by 10

        # Create a frame to hold the buttons at the bottom
        buttons_frame = tk.Frame(root, bg=background_color)
        buttons_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=10, padx=10)

        buttons_left_frame = tk.Frame(buttons_frame, bg=background_color)
        buttons_left_frame.pack(side=tk.LEFT)

        buttons_right_frame = tk.Frame(buttons_frame, bg=background_color)
        buttons_right_frame.pack(side=tk.RIGHT)

        # Create the left-side button
        button_cancel = tk.Button(buttons_left_frame, text="Prekliči", command=close_dialog)
        button_cancel.pack(side=tk.LEFT)

        # Create two right-side buttons inside the right frame
        button_folder = tk.Button(buttons_right_frame, text="Izberite mapo z datotekami", command=select_folder)
        button_folder.pack(side=tk.LEFT, padx=(0, 10))

        button_individual = tk.Button(buttons_right_frame, text="Izberite posamezne datoteke", command=select_individual)
        button_individual.pack(side=tk.RIGHT)

        # Start the Tkinter event loop
        root.mainloop()
        
        # After closing tkinter, if any file is missing, close the whole thing (X was pressed)
        if(remaining_backdrops or remaining_sounds or remaining_sprites):
            sys.exit()

    def set_draw_list_figures(self):
        """Sets the dictionary with drawable ids as keys and sprites as values."""
        drawListFigures = {}
        for figure in self.figures:
            #if not figure._is_clone:
            drawListFigures[figure._drawableId] = figure
        return drawListFigures

    def restart_timer(self):
        """Restarts the timer."""
        self.startTime = time.time()
        self.currentTimer = 0
        self.previousTimer = 0

class Image:
    """Image class for images - costumes of sprites and backdrops of stage."""
    def __init__(self, id, name, image: pygame.Surface, rotation_center_x = 0, rotation_center_y = 0, bitmap_resolution = 1):
        self.id = id
        # Downscale size and rotation center by dividing with bitmap resolution (because we work with png)
        image = pygame.transform.scale(image, (image.width / bitmap_resolution, image.height / bitmap_resolution))
        rotation_center_x = rotation_center_x / bitmap_resolution
        rotation_center_y = rotation_center_y / bitmap_resolution
        self.name = name
        self.originalImage = image # original image
        self.image = image # image after applied transformations
        # The distance between topleft position of costume's rectangle and center position of sprite (in local coords)
        self.original_rotation_center_x = rotation_center_x # the offset on x axis from image's top-left corner to center of drawing window (only for costumes, from Scratch costume designer positioning)
        self.original_rotation_center_y = rotation_center_y # the offset on y axis from image's top-left corner to center of drawing window (only for costumes, from Scratch costume designer positioning)
        self.rotation_center_x = rotation_center_x # rotation center x after applied transformations
        self.rotation_center_y = rotation_center_y # rotation center y after applied transformations
        self.rotation_diff_x = 0
        self.rotation_diff_y = 0
        self.bitmap_resolution = bitmap_resolution

class Sound:
    """Sound class for sounds that belong to a sprite or background."""
    def __init__(self, target, name, sound: pygame.mixer.Sound):
        self.name = name
        self.sound = sound
        self.channel: pygame.mixer.Channel = None
        self.target: Union[Figure, Stage] = target

    def is_sound_playing(self) -> bool:
        """Checks if sound is playing."""
        if self.channel:
            return self.channel.get_busy()
        else:   
            return False

    def play_sound(self):
        """Plays the sound."""
        if self.is_sound_playing():
            self.stop_sound()
        self.sound.set_volume(self.target._soundsVolume)
        self.channel = self.sound.play()
    
    def stop_sound(self):
        """Stops playing the sound."""
        if self.channel and self.is_sound_playing():
            self.channel.stop()

    def change_volume(self):
        """Changes the volume of the sound."""
        self.sound.set_volume(self.target._soundsVolume)

class Target(ABC):
    """Target class, a parent class for sprites and stage, it contains the common variables and Scratch block methods. Some block methods are constructed entirely in JavaScript."""
    def __init__(self, game: Game, startingVariables: Dict[str, Tuple[str, Any]], startingLists: Dict[str, Tuple[str, List[Any]]]):
        self._game = game # class Game
        self._scripts: Dict[int, List[Script]] = {}

        self._sounds: Dict[str, Sound] = defaultdict(Sound)
        self._soundNames = []
        self._soundsVolume = 1.0 # scratch volume: 0 - 100, pygame volume: 0.0 - 1.0

        self._currentLooksEffects: Dict[EnumLooksEffect, int] = defaultdict(int)

        self._ask_panel: pygame_gui.elements.UIPanel = None
        self._answerText = ""

        self._variables: Dict[str, Dict[str, Any]] = defaultdict(Dict)
        self._lists: Dict[str, Dict[str, List]] = defaultdict(Dict)
        self._variables_names: Dict[str, str] = defaultdict(str)

        self._set_variables(startingVariables, startingLists)

    def _set_scripts(self):
        """Sets self as a script's target."""
        for event, scripts in self._scripts.items():
            for script in scripts:
                script.target = self

    def _set_variables(self, startingVariables: Dict[str, Tuple[str, Any]], startingLists: Dict[str, Tuple[str, List[Any]]]):
        """Sets the variables."""
        for name, value in startingVariables.items():
            self._variables[name] = {"value": value[1], "visible": False}
            self._variables_names[name] = value[0]
        for name, value in startingLists.items():
            self._lists[name] = {"value": value[1], "visible": False}
            self._variables_names[name] = value[0]

    @abstractmethod
    def _get_image_and_boudning_rect(self):
        """Applies transformations and returns image rect and bounding rect of a sprite or stage."""
        pass

    def _scratch_to_pygame_coords(self, sc_x, sc_y):
        """Converts scratch coordinates to pygame coordinates."""
        py_x = self._game.width // 2 + sc_x * self._game.scale_factor + self._game.right_margin
        py_y = self._game.height // 2 - sc_y * self._game.scale_factor + self._game.top_margin # negate y coord
        return (py_x, py_y)
    
    def _pygame_to_scratch_coords(self, py_x, py_y):
        """Converts pygame coordinates to scratch coordinates."""
        sc_x = (py_x - self._game.width // 2 - self._game.left_margin) / self._game.scale_factor
        sc_y = (- (py_y - self._game.height // 2 - self._game.top_margin)) / self._game.scale_factor
        return (sc_x, sc_y)

    # NOT FULLY IMPLEMENTED
    def _apply_effects(self, image: pygame.Surface, costume: Image):
        """Applies different effects to the image."""
        for effect, value in self._currentLooksEffects.items():
            if effect == EnumLooksEffect.COLOR:
                # TODO: change color
                try:
                    width, height = image.get_size()
                    # Convert to string buffer, and use this to create a PIL Image
                    data = pygame.image.tobytes(image, "RGBA")
                    pil_image = PILImage.frombytes("RGBA", (width, height), data)
                    
                    # Split RGBA image into RGB and Alpha channels
                    rgb_image, alpha = pil_image.split()[:3], pil_image.split()[-1]
                    
                    # Convert image to HSV
                    hsv_image = PILImage.merge('RGB', rgb_image).convert('HSV')
                    
                    # Split into individual channels
                    h, s, v = hsv_image.split()

                    # Convert the hue channel to a NumPy array to manipulate it
                    h_np = np.array(h, dtype=np.uint8)

                    # Shift the hue, ensuring that it stays within 0-255 (PIL works with this range, Scratch works with 0-360, also Scratch works with HSL)
                    h_np = np.mod(h_np.astype(np.int16) + value, 256).astype(np.uint8)

                    # Convert the NumPy array back to a PIL Image
                    h = PILImage.fromarray(h_np, 'L')

                    # Merge back the HSV channels
                    hsv_image = PILImage.merge('HSV', (h, s, v))

                    # Convert back to RGB
                    rgb_image = hsv_image.convert('RGB')

                    # Merge the modified RGB image with the original Alpha channel
                    rgba_image = PILImage.merge('RGBA', (*rgb_image.split(), alpha))
                    
                    # Convert back to string data
                    mode = rgba_image.mode
                    size = rgba_image.size
                    data = rgba_image.tobytes()
                    
                    # Create a Pygame surface from the string data
                    pygame_surface = pygame.image.frombytes(data, size, mode)
                    pygame_surface
                    costume.image = pygame_surface
                except Exception as e:
                    print("Exception:", e)
                    traceback.print_exc()
            elif effect == EnumLooksEffect.FISHEYE:
                # TODO: apply fisheye
                try:
                    value = value / 100
                    width, height = image.get_size()
                    center_x, center_y = width // 2, height // 2
                    fisheye_surface = pygame.Surface(image.get_size(), pygame.SRCALPHA)

                    for x in range(width):
                        for y in range(height):
                            # Calculate distance from the center
                            dx = x - center_x
                            dy = y - center_y
                            distance = math.sqrt(dx ** 2 + dy ** 2)

                            # Calculate the fisheye distortion factor
                            factor = 1 + value * (distance / max(center_x, center_y))  # Adjust strength as needed
                            new_x = int(center_x + dx * factor)
                            new_y = int(center_y + dy * factor)

                            # Check bounds
                            if 0 <= new_x < width and 0 <= new_y < height:
                                color = image.get_at((x, y))
                                fisheye_surface.set_at((new_x, new_y), color)

                    costume.image = fisheye_surface
                except Exception as e:
                    print("Exception:", e)
                    traceback.print_exc()
            elif effect == EnumLooksEffect.WHIRL:
                # TODO: apply whirl
                try:
                    value = value / 100
                    width, height = image.get_size()
                    center_x, center_y = width // 2, height // 2
                    whirl_surface = pygame.Surface(image.get_size(), pygame.SRCALPHA)

                    for x in range(width):
                        for y in range(height):
                            # Calculate distance and angle from the center
                            dx = x - center_x
                            dy = y - center_y
                            distance = math.sqrt(dx ** 2 + dy ** 2)
                            angle = math.atan2(dy, dx)

                            # Calculate the whirl distortion
                            whirl_angle = angle + value * (distance / max(center_x, center_y))
                            new_x = int(center_x + distance * math.cos(whirl_angle))
                            new_y = int(center_y + distance * math.sin(whirl_angle))

                            # Check bounds
                            if 0 <= new_x < width and 0 <= new_y < height:
                                color = image.get_at((x, y))
                                whirl_surface.set_at((new_x, new_y), color)
                    costume.image = whirl_surface
                except Exception as e:
                    print("Exception:", e)
                    traceback.print_exc()
                pass
            elif effect == EnumLooksEffect.PIXELATE:
                # TODO: apply pixelate
                try:
                    width, height = image.get_size()
                    pixelated_surface = pygame.Surface(image.get_size(), pygame.SRCALPHA)

                    for x in range(0, width, value):
                        for y in range(0, height, value):
                            # Define the area to average
                            area = []
                            for dx in range(value):
                                for dy in range(value):
                                    if x + dx < width and y + dy < height:
                                        area.append(image.get_at((x + dx, y + dy)))

                            # Calculate the average color and alpha
                            if area:
                                # Initialize sums for color and alpha
                                r_sum, g_sum, b_sum, a_sum = 0, 0, 0, 0
                                for color in area:
                                    r_sum += color[0]
                                    g_sum += color[1]
                                    b_sum += color[2]
                                    a_sum += color[3]
                                
                                # Average values
                                num_pixels = len(area)
                                avg_color = (
                                    r_sum // num_pixels,
                                    g_sum // num_pixels,
                                    b_sum // num_pixels,
                                    a_sum // num_pixels,
                                )
                                
                                # Fill the pixelated area with the average color
                                for dx in range(value):
                                    for dy in range(value):
                                        if x + dx < width and y + dy < height:
                                            pixelated_surface.set_at((x + dx, y + dy), avg_color)
                    costume.image = pixelated_surface
                except Exception as e:
                    print("Exception:", e)
                    traceback.print_exc()
                pass
            elif effect == EnumLooksEffect.MOSAIC:
                # TODO: apply mosaic
                pass
            elif effect == EnumLooksEffect.BRIGHTNESS:
                # TODO: change brightness
                # Keep within range (100 -> max bright(white), -1 -> max dark(black))
                if value > 100:
                    value = 100
                if value < -100:
                    value = -100
                # if brightness didnt change, skip this
                if value == 0:
                    continue
                self._currentLooksEffects[effect] = value
                width, height = image.get_size()
                # Lock the surface to access the pixel data
                image.lock()
                for x in range(width):
                    for y in range(height):
                        # Get the pixel's RGBA values
                        r, g, b, a = image.get_at((x, y))
                        
                        # Convert the RGB values to the [0, 1] range for colorsys
                        r_norm = r / 255.0
                        g_norm = g / 255.0
                        b_norm = b / 255.0
                        
                        # Convert RGB to HSV
                        h, s, v = colorsys.rgb_to_hsv(r_norm, g_norm, b_norm)
                        
                        # Increase brightness by modifying the V component
                        # Ensure the value doesn't exceed 1.0
                        scaled_value = (value + 100) / 100 # scale to 0-2
                        v = min(1.0, v * scaled_value)
                        
                        # Convert HSV back to RGB
                        r_new, g_new, b_new = colorsys.hsv_to_rgb(h, s, v)
                        
                        # Convert the normalized RGB values back to the [0, 255] range
                        r_new = int(r_new * 255)
                        g_new = int(g_new * 255)
                        b_new = int(b_new * 255)
                        
                        # Set the new pixel color back on the surface
                        image.set_at((x, y), (r_new, g_new, b_new, a))
                image.unlock()
                costume.image = image
            elif effect == EnumLooksEffect.GHOST:
                # clamp value between 0 and 100
                if value > 100:
                    value = 100
                elif value < 0:
                    value = 0
                self._currentLooksEffects[effect] = value
                # Convert ghost effect percentage to alpha (0 to 255)
                # 0 is fully opaque, 100 is fully transparent
                alpha_value = 255 * (1 - value / 100)
                costume.image.set_alpha(alpha_value)
    
    async def _sleep(self, seconds):
        """Sleeps for given amount of time."""
        await asyncio.sleep(seconds)

    def _cancel(self):
        """When all scripts of this target are cancelled, sets some values to default ones."""
        self._answerText = False
        self._game.answered = False
        self._game.answerText = False
        self._game.isAsking = False
        if self._ask_panel:
            self._ask_panel.kill()
        # Stop all sounds
        for sound in self._sounds.values():
            sound.stop_sound()
        self._cancel_self()

    @abstractmethod
    def _cancel_self(self):
        """When all scripts of this target are cancelled, sets specific values of sprites or stages to default ones."""
        pass


    # --- Videzi ---

    # blok 7: zamenjaj ozadje na [X1, X2, ..., naslednje ozadje, prejšnje ozadje, naključno ozadje]
    def looks_change_backdrop_to(self, backdrop_option: str) -> None:
        """
        Changes current backdrop to the given backdrop.

        Args:
            backdrop_option (str): The name of the backdrop or an option from EnumBackdropChangeTo (next backdrop, previous backdrop, random backdrop).
        """
        try:
            # Convert the string to the corresponding Enum (if backdrop_option in EnumBackdropChangeTo)
            option = EnumBackdropChangeTo(backdrop_option)

            if option == EnumBackdropChangeTo.NEXT:
                currentBackdropIndx = self._game.stage._backdropNames.index(self._game.stage._currentBackdropName)
                nextBackdropIndx = (currentBackdropIndx + 1) % len(self._game.stage._backdropNames)
                self._game.stage._currentBackdropName = self._game.stage._backdropNames[nextBackdropIndx]
            elif option == EnumBackdropChangeTo.PREVIOUS:
                currentBackdropIndx = self._game.stage._backdropNames.index(self._game.stage._currentBackdropName)
                previousBackdropIndx = (currentBackdropIndx - 1) % len(self._game.stage._backdropNames)
                self._game.stage._currentBackdropName = self._game.stage._backdropNames[previousBackdropIndx]
            elif option == EnumBackdropChangeTo.RANDOM:
                newBackdropIndx = random.randint(0, len(self._game.stage._backdropNames) - 1)
                self._game.stage._currentBackdropName = self._game.stage._backdropNames[newBackdropIndx]
                
        except ValueError:
            # if backdrop_option not in EnumBackdropChangeTo, then backdrop_option is a specific backdropname
            self._game.stage._currentBackdropName = backdrop_option if backdrop_option in self._game.stage._backdropNames else self._game.stage._currentBackdropName
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

        # Trigger event
        new_event = pygame.event.Event(EnumEventType.EVENT_BACKDROP_CHANGED.value, {"backdropChangeName": self._game.stage._currentBackdropName})
        pygame.event.post(new_event)

    # blok 8: naslednje ozadje
    def looks_next_backdrop(self) -> None:
        """
        Changes current backdrop to the next backdrop.

        Args:
        """
        currentBackdropIndx = self._game.stage._backdropNames.index(self._game.stage._currentBackdropName)
        nextBackdropIndx = (currentBackdropIndx + 1) % len(self._game.stage._backdropNames)
        self._game.stage._currentBackdropName = self._game.stage._backdropNames[nextBackdropIndx]

        new_event = pygame.event.Event(EnumEventType.EVENT_BACKDROP_CHANGED.value, {"backdropChangeName": self._game.stage._currentBackdropName})
        pygame.event.post(new_event)

    # blok 11: spremeni učinek [barva, ribje oko, vrtinec, pikčasto, mozaik, svetlost, duh] za X
    def looks_change_effect_for(self, looks_effect_option: str, value: float) -> None:
        """
        Changes the given effect for a given amount of a sprite or a backdrop.
        Note: this functionality is not fully implemented.

        Args:
            looks_effect_option (str): The name of the image effect (an option from EnumLooksEffect (color, fisheye, whirl, pixelate, mosaic, brightness, ghost)).
            value (float): The amount to change the effect for.
        """
        try:
            value = float(value)
            option = EnumLooksEffect(looks_effect_option)
            # effect effects all costumes of a figure
            self._currentLooksEffects[option] += value
        except ValueError as v:
            print("Unknown image effect. Please try a different image effect.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 12: nastavi učinek [barva, ribje oko, vrtinec, pikčasto, mozaik, svetlost, duh] na X
    def looks_set_effect_to(self, looks_effect_option: str, value: float) -> None:
        """
        Changes the given effect to a given amount of a sprite or a backdrop.
        Note: this functionality is not fully implemented.

        Args:
            looks_effect_option (str): The name of the image effect (an option from EnumLooksEffect (color, fisheye, whirl, pixelate, mosaic, brightness, ghost)).
            value (float): The amount to change the effect to.
        """
        try:
            value = float(value)
            option = EnumLooksEffect(looks_effect_option)
            # effect effects all costumes of a figure
            self._currentLooksEffects[option] = value
        except ValueError as v:
            print("Unknown image effect. Please try a different image effect.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 13: odstrani slikovne učinke
    def looks_remove_effects(self) -> None:
        """
        Removes all effects from a sprite or a backdrop.

        Args:
        """
        # set all effects to 0
        for looksEffect in self._currentLooksEffects.keys():
            self._currentLooksEffects[looksEffect] = 0
        pass

    # blok 19: ozadje [število, ime] (variable)
    def looks_backdrop(self, backdrop_number_name_option: str) -> int | float:
        """
        Returns the value of a given option of a backdrop.

        Args:
            backdrop_number_name_option (str): An option from EnumNumberName (number, name).
        """
        try:
            option = EnumNumberName(backdrop_number_name_option)
            if option == EnumNumberName.NUMBER:
                backdropIndex = self._game.stage._backdropNames.index(self._game.stage._currentBackdropName)
                return backdropIndex + 1
            elif option == EnumNumberName.NAME:
                return self._game.stage._currentBackdropName
        except ValueError as v:
            print("Unknown backdrop option. Please try a different backdrop option.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
        return ""


    # --- Zvok ---

    # blok 1: predvajaj zvok [X1, X2, ..., posnami...] do konca 
    async def sound_play_sound_until_done_async(self, sound_name: str) -> None:
        """
        Plays the given sound and waits for it to finish.
        Note: you must add "await" before the method call.

        Args:
            sound_name (str): The name of the sound.
        """
        # ko v Scratchu izbereš "posnami...", se avtomatsko odpre okno za snemanje zvoke ter se vrednost v kocki spremeni na ime posnetega zvoka - nikoli ni vrednost v kocki dejansko vrednost "posnami..."
        if sound_name in self._sounds.keys():
            sound = self._sounds[sound_name]
            sound.play_sound()
            while sound.is_sound_playing():
                await self._sleep(self._game.frameDuration)

    # blok 2: predvajaj zvok [X1, X2, ..., posnami...] 
    def sound_play_sound(self, sound_name: str) -> None:
        """
        Plays the given sound.

        Args:
            sound_name (str): The name of the sound.
        """
        # ko v Scratchu izbereš "posnami...", se avtomatsko odpre okno za snemanje zvoke ter se vrednost v kocki spremeni na ime posnetega zvoka - nikoli ni vrednost v kocki dejansko vrednost "posnami..."
        if sound_name in self._sounds.keys():
            sound = self._sounds[sound_name]
            sound.play_sound()

    # blok 3: ustavi vse zvoke
    def sound_stop_all_sounds(self) -> None:
        """
        Stops all sounds that were playing of a sprite or the stage.

        Args:
        """
        for figure in self._game.figures:
            for sound in figure._sounds.values():
                sound.stop_sound()

    # blok 4: spremeni učinek [višina tona, premik levo/desno] za X
    def sound_change_effect_for(self, sound_effect_option: str, value: float) -> None:
        """
        Changes the given effect of all sounds of a sprite or the stage for a given amount.
        Note: this functionality is not implemented.

        Args:
            sound_effect_option (str): The name of the sound effect (an option from EnumSoundEffect (pitch, pan left/right)).
            value (float): The amount to change the effect for.
        """
        # NOT IMPLEMENTED: apply effect, pygame ne podpira tega! 
        try:
            value = float(value)
            option = EnumSoundEffect(sound_effect_option)
            # effect effects all sounds of a figure
            if option == EnumSoundEffect.PITCH:
                pass
            elif option == EnumSoundEffect.PAN:
                pass
        except ValueError as v:
            print("Unknown sound effect. Please try a different sound effect.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
    
    # blok 5: spremeni učinek [višina tona, premik levo/desno] na X
    def sound_change_effect_to(self, sound_effect_option: str, value: float) -> None:
        """
        Changes the given effect of all sounds of a sprite or the stage to a given amount.
        Note: this functionality is not implemented.

        Args:
            sound_effect_option (str): The name of the sound effect (an option from EnumSoundEffect (pitch, pan left/right)).
            value (float): The amount to change the effect to.
        """
        # NOT IMPLEMENTED: apply effect, pygame ne podpira tega!
        try:
            value = float(value)
            option = EnumSoundEffect(sound_effect_option)
            # effect effects all sounds of a figure
            if option == EnumSoundEffect.PITCH:
                pass
            elif option == EnumSoundEffect.PAN:
                pass
        except ValueError as v:
            print("Unknown sound effect. Please try a different sound effect.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
    
    # blok 6: izbriši zvočne učinke
    def sound_remove_effects(self) -> None:
        """
        Removes all effects from all sounds of a sprite or the stage.
        
        Args:
        """
        # NOT IMPLEMENTED, pygame ne podpira tega!
        pass

    # blok 7: spremeni glasnost za X
    def sound_change_volume_for(self, value: float) -> None:
        """
        Changes the volume of all sounds of a sprite or the stage for a given amount.

        Args:
            value (float): The amount to change the volume for.
        """
        try:
            volume = float(value)
            volume = volume / 100
            self._soundsVolume += volume
            if(self._soundsVolume < 0):
                self._soundsVolume = 0.0
            elif(self._soundsVolume > 1):
                self._soundsVolume = 1.0
            for sound in self._sounds.values():
                sound.change_volume()
        except Exception as e:
            print("Exception in sound_change_volume_for.", e)
        

    # blok 8: nastavi glasnost na X %
    def sound_change_volume_to(self, value: float) -> None:
        """
        Changes the volume of all sounds of a sprite or the stage to a given amount.

        Args:
            value (float): The amount to change the volume to.
        """
        try:
            volume = float(value)
            volume = volume / 100
            self._soundsVolume = volume
            if(self._soundsVolume < 0):
                self._soundsVolume = 0.0
            elif(self._soundsVolume > 1):
                self._soundsVolume = 1.0
            for sound in self._sounds.values():
                sound.change_volume()
        except Exception as e:
            print("Exception in sound_change_volume_to.", e)

    # blok 9: glasnost (variable)
    def sound_volume(self) -> float:
        """
        Returns the sound volume of a sprite or the stage.

        Args:
        """
        return self._soundsVolume * 100
    

    # --- Dogodki ---

    # blok 7: objavi [Novo sporočilo, X1, X2, ...]
    def events_broadcast(self, message: str) -> None:
        """
        Broadcasts a message with the given text.

        Args:
            message (str): The text for the message.
        """
        # "Novo sporočilo" ni nikoli izbrano, saj se v Scratchu odpre okno, kjer vpišeš novo sporočilo in se vrednost avtomatsko nastavi na to vpisano sporočilo
        new_event = pygame.event.Event(EnumEventType.EVENT_BROADCAST_RECIEVED.value, {"broadcastValue": message})
        pygame.event.post(new_event)

    # blok 8: objavi [Novo sporočilo, X1, X2, ...] in čakaj 
    async def events_broadcast_wait_async(self, message: str) -> None:
        """
        Broadcasts a message with the given text and waits for all scripts that wait to recieve this message to finish.
        Note: you must add "await" before the function call.

        Args:
            message (str): The text for the message.
        """
        # čaka da se vse skripte ki so pognane prek tega broadcast sporočila končajo, "Novo sporočilo" ni nikoli izbrano, saj se v Scratchu odpre okno, kjer vpišeš novo sporočilo in se vrednost avtomatsko nastavi na to vpisano sporočilo
        new_event = pygame.event.Event(EnumEventType.EVENT_BROADCAST_RECIEVED.value, {"broadcastValue": message})
        pygame.event.post(new_event)
        broadcast_scripts: List[Script] = []
        # Take keys and make a copy in case if subscribers dict changes meanwhile
        for target in list(self._game.subscribers.keys()):
            events = self._game.subscribers[target]
            if not EnumEventType.EVENT_BROADCAST_RECIEVED.value in events:
                continue
            broadcast_scripts_list = events[EnumEventType.EVENT_BROADCAST_RECIEVED.value]
            for script in broadcast_scripts_list:
                if script.check_condition({"broadcastValue": message}):
                    script.started_by_broadcast = True
                    broadcast_scripts.append(script)
        # break loop when all scripts change started_by_broadcast to False
        while True:
            cancel = True
            for script in broadcast_scripts:
                if script.started_by_broadcast:
                    cancel = False
                    break
            if cancel:
                break
            await self._sleep(self._game.frameDuration)

    
    # --- Krmiljenje ---

    # blok 1: počakaj X sekund
    async def control_wait_async(self, seconds: float) -> None:
        """
        Waits at current position in script for a given amount of seconds.
        Note: you must add "await" before the method call.

        Args:
            seconds (float): Number of seconds to wait.
        """
        # If seconds = 0, then change it to frameDuration, otherwise, it's too fast.
        try:
            seconds = float(seconds)
            if seconds <= 0:
                seconds = self._game.frameDuration
            await self._sleep(seconds)
        except Exception as e:
            print("Exception in control_wait_async.", e)

    # blok 8: ustavi [vse, te ukaze, ostale ukaze za ta lik]
    async def control_stop_async(self, stop_option: str) -> None:
        """
        Stops all scripts, current script or all scripts for current sprite, based on the given stop option.
        Note: you must add "await" before the method call.

        Args:
            stop_option (str): An option from EnumStop (all scripts, this script, this sprite's scripts).
        """
        try:
            option = EnumStop(stop_option)
            if option == EnumStop.ALL:
                await self._game.eventSystem.cancel_all_scripts()
            elif option == EnumStop.THIS_SCRIPT:
                cancel = False
                # get the name of the script (coroutine) that called this control_stop
                caller_script_name = inspect.stack()[1].function
                for scripts in self._scripts.values():
                    for script in scripts:
                        # get the name of the script (coroutine)
                        script_name = script.func.__name__
                        if(caller_script_name == script_name):
                            # CancelledError propagates to this point and CancelledError is raised, which "crashes" the task that called this and finishes.
                            try:
                                await self._game.eventSystem.cancel_own_script(script)
                            except asyncio.CancelledError:
                                raise
                            cancel = True
                            break
                    if cancel:
                        break
            elif option == EnumStop.OTHER_SPRITE_SCRIPTS:
                scripts_to_cancel = []
                # get the name of the script (coroutine) that called this control_stop
                caller_script_name = inspect.stack()[1].function
                for scripts in self._scripts.values():
                    for script in scripts:
                        # get the name of the script (coroutine)
                        # Error RecursionError happens when there is a sprite with "when broadcast recieved" blocks, which have the same message and they both call "stop other sprite's scripts".
                        script_name = script.func.__name__
                        if(caller_script_name != script_name and script.isRunning):
                            scripts_to_cancel.append(script)
                await self._game.eventSystem.cancel_scripts(scripts_to_cancel)
        except ValueError as v:
            print("Unknown stop control. Please try a different stop control.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()


    # --- Zaznavanje ---

    # blok 6: odgovor (variable)
    def sensing_answer(self) -> str:
        """
        Returns the answer from the ask block.

        Args:
        """
        return self._answerText
    
    # blok 7: je pritisnjena tipka [presledek, ...] ?
    def sensing_is_button_held(self, button: str) -> bool:
        """
        Returns True if a given button is pressed or False if it is not pressed.

        Args:
            button (str): The name of the button (a value from buttons)
        """
        if button not in buttons.keys():
            return False
        buttonValue = buttons[button]
        if not buttonValue:
            # this is "any" key
            pressedButtons = self._game.pressedKeys.values()
            return any(pressedButtons)
        else:
            if buttonValue in self._game.pressedKeys.keys():
                return self._game.pressedKeys[buttonValue]

    # blok 8: je miškin gumb pritisnjen?
    def sensing_is_mouse_held(self) -> bool:
        """
        Returns True if one of the mouse buttons is pressed or False if no button is pressed.

        Args:
        """
        mouse_buttons = pygame.mouse.get_pressed()
        return any(mouse_buttons)
    
    # blok 9: miškin x (variable)
    def sensing_mouse_x(self) -> int:
        """
        Returns the current x position of the mouse.

        Args:
        """
        mouse_x, _ = pygame.mouse.get_pos()
        if mouse_x < self._game.left_border:
            mouse_x = self._game.left_border
        elif mouse_x > self._game.right_border:
            mouse_x = self._game.right_border
        # convert to scratch coords
        sc_x, _ = self._pygame_to_scratch_coords(mouse_x, 0)
        return round(sc_x)
    
    # blok 10: miškin y (variable)
    def sensing_mouse_y(self) -> int:
        """
        Returns the current y position of the mouse.

        Args:
        """
        _, mouse_y = pygame.mouse.get_pos()
        if mouse_y < self._game.top_border:
            mouse_y = self._game.top_border
        elif mouse_y > self._game.bottom_border:
            mouse_y = self._game.bottom_border
        # convert to scratch coords
        _, sc_y = self._pygame_to_scratch_coords(0, mouse_y)
        return round(sc_y)
    
    # blok 12: glasnost (variable)
    def sensing_loudness(self) -> float:
        """
        Returns the loudness of a sprite or the stage.

        Args:
        """
        return self._game.currentLoudness
    
    # blok 13: štoparica (variable)
    def sensing_timer(self) -> float:
        """
        Returns the current game timer value.

        Args:
        """
        return self._game.currentTimer
    
    # blok 14: ponastavi štoparico
    def sensing_reset_timer(self) -> None:
        """
        Resets the game timer to 0.

        Args:
        """
        self._game.restart_timer()
    
    # blok 15: [ozadje #, ime ozadja, glasnost, X1, X2, ...] od Oder / [položaj x, položaj y, smer, videz #, ime videza, velikost, glasnost, X1, X2, ...] od Figure (variable)
    def sensing_variable_from(self, variable_option: str, variable_from_option: str) -> int | str | float:
        """
        Returns the given variable option value from the stage or a sprite.

        Args:
            variable_option (str): An option from EnumVariable (if variable_from_option is the stage: backdrop number, backdrop name, volume, if variable_from_option is a sprite: position x, position y, direction, costume number, costume name, size, volume) or the name of a user defined variable.
            variable_from_option (str): An option from EnumVariableFrom (stage) or the name of a sprite.
        """
        # X so imena spremenljivk
        try:
            option1 = EnumVariableFrom(variable_from_option)
            if option1 == EnumVariableFrom.STAGE:
                stage = self._game.stage
                try:
                    option2 = EnumVariable(variable_option)
                    if option2 == EnumVariable.BACKDROP_NO:
                        for i in range(len(stage._backdropNames)):
                            if stage._backdropNames[i] == stage._currentBackdropName:
                                return i + 1
                    elif option2 == EnumVariable.BACKDROP_NAME:
                        return stage._currentBackdropName
                    elif option2 == EnumVariable.VOLUME:
                        return stage._soundsVolume
                except ValueError:
                    # variableOption is the name of a user defined variable
                    if variable_option in stage._variables.keys():
                        return stage._variables[variable_option]["value"]
                except Exception as e:
                    print("Exception:", e)
                    traceback.print_exc()
        except ValueError:
            # variableFromOption is the name of a figure
            selected_figure = None
            for figure in self._game.figures[:]:
                if figure._name == variable_from_option:
                    selected_figure = figure
                    break
            if not selected_figure:
                return
            try:
                option = EnumVariable(variable_option)
                if option == EnumVariable.POSITION_X:
                    sc_x, _ = selected_figure._pygame_to_scratch_coords(selected_figure._pos_x, selected_figure._pos_y)
                    return sc_x
                elif option == EnumVariable.POSITION_Y:
                    _, sc_y = selected_figure._pygame_to_scratch_coords(selected_figure._pos_x, selected_figure._pos_y)
                    return sc_y
                elif option == EnumVariable.DIRECTION:
                    sc_angle = selected_figure._pygame_to_scratch_angle(selected_figure._angle)
                    return sc_angle
                elif option == EnumVariable.COSTUME_NO:
                    for i in range(len(selected_figure._costumeNames)):
                        if selected_figure._costumeNames[i] == selected_figure._currentCostumeName:
                            return i + 1
                elif option == EnumVariable.COSTUME_NAME:
                    return selected_figure._currentCostumeName
                elif option == EnumVariable.SIZE:
                    sc_scale = selected_figure._pygame_to_scratch_scale(selected_figure._scale_factor)
                    return sc_scale
                elif option == EnumVariable.VOLUME:
                    return selected_figure._soundsVolume * 100
            except ValueError:
                # variableOption is the name of a user defined variable
                if variable_option in selected_figure._variables.keys():
                        return selected_figure._variables[variable_option]["value"]
            except Exception as e:
                print("Exception:", e)
                traceback.print_exc()
        except Exception as e:
                    print("Exception:", e)
                    traceback.print_exc()
                
    # blok 16: trenutni [leto, mesec, datum, dan v tednu, ura, minuta, sekunda] (variable)
    def sensing_current(self, current_option: str) -> int | str:
        """
        Returns the value of a given time option.

        Args:
            current_option (str): An option from EnumCurrent (year, month, date, day of week, hour, minute, second).
        """
        try:
            option = EnumCurrent(current_option)
            if option == EnumCurrent.YEAR:
                return datetime.now().year
            elif option == EnumCurrent.MONTH:
                return datetime.now().month
            elif option == EnumCurrent.DATE:
                return datetime.now().day
            elif option == EnumCurrent.DAY_OF_WEEK:
                # for some reason, Scratch starts week with sunday
                return datetime.now().weekday() + 2
            elif option == EnumCurrent.HOUR:
                return datetime.now().hour
            elif option == EnumCurrent.MINUTE:
                return datetime.now().minute
            elif option == EnumCurrent.SECOND:
                return datetime.now().second
        except ValueError as v:
            print("Unknown time option. Please try a different time option.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 17: dni od leta 2000 (variable)
    def sensing_days_sice_2000(self) -> float:
        """
        Returns the number of days since the year 2000 to the current year.

        Args:
        """
        start_date = datetime(2000, 1, 1)
        current_date = datetime.now()
        time_difference = current_date - start_date
        days_since_2000 = time_difference.total_seconds() / (24 * 3600)
        return days_since_2000
    
    # blok 18: uporabniško ime (variable)
    def sensing_username(self) -> str:
        """
        Returns the username.
        """
        return self._game.username
    

    # --- Operatorji ---

    # blok 5: naključno število med X1 in X2
    def operators_random_number(self, value1: int | float, value2: int | float) -> int | float:
        """
        Returns a random number between value1 and value2 (including both ends).

        Args:
            value1 (int | float): The first end number.
            value2 (int | float): The second end number.
        """
        # If both numbers are ints, return a random int, else return a random float
        if value2 < value1:
            value2, value1 = value1, value2
        if isinstance(value1, int) and isinstance(value2, int):
            return random.randint(value1, value2)
        else:
            return random.uniform(value1, value2)
    
    # blok 6: X1 > X2
    def operators_greater_than(self, value1: int | float | str, value2: int | float | str) -> bool:
        """
        Returns True if value1 is greater than value2 numerically or lexicographically (alphabetically) if one of them is a string, else returns False.

        Args:
            value1 (int | float | str): The first value to compare.
            value2 (int | float | str): The second value to compare.
        """
        # If both values are numbers => compare numerically, if one is string => compare lexicographically (alphabetically), numbers smaller than letters
        try:
            # Try converting both to floats if possible
            a_float = float(value1)
            b_float = float(value2)
            return a_float > b_float
        except ValueError:
            # If conversion fails, fall back to lexicographic comparison
            return str(value1) > str(value2)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 7: X1 < X2
    def operators_less_than(self, value1: int | float | str, value2: int | float | str) -> bool:
        """
        Returns True if value1 is less than value2 numerically or lexicographically (alphabetically) if one of them is a string, else returns False.

        Args:
            value1 (int | float | str): The first value to compare.
            value2 (int | float | str): The second value to compare.
        """
        # If both values are numbers => compare numerically, if one is string => compare lexicographically (alphabetically), numbers smaller than letters
        try:
            # Try converting both to floats if possible
            a_float = float(value1)
            b_float = float(value2)
            return a_float < b_float
        except ValueError:
            # If conversion fails, fall back to lexicographic comparison
            return str(value1) < str(value2)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 8: X1 = X2
    def operators_equals(self, value1: int | float | str, value2: int | float | str) -> bool:
        """
        Returns True if value1 is equal to value2 numerically or lexicographically (alphabetically) if one of them is a string, else returns False.

        Args:
            value1 (int | float | str): The first value to compare.
            value2 (int | float | str): The second value to compare.
        """
        # If both values are numbers => compare numerically, if one is string => compare lexicographically (alphabetically), numbers smaller than letters
        try:
            # Try converting both to floats if possible
            a_float = float(value1)
            b_float = float(value2)
            return a_float == b_float
        except ValueError:
            # If conversion fails, fall back to lexicographic comparison
            return str(value1) == str(value2)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 12: združi X1 X2
    def operators_concatenate(self, value1: str, value2: str) -> str:
        """
        Returns the concatenated value of two values.

        Args:
            value1 (str): The first value to concatenate.
            value2 (str): The second value to concatenate.
        """
        return str(value1) + str(value2)
    
    # blok 13: X1 črka v X2
    def operators_letter_in(self, number: int, value: str) -> str:
        """
        Returns the number-th letter of a given value.

        Args:
            number (int): The letter position value.
            value (str): The string to get the letter from.
        """
        number = int(number)
        value = str(value)
        number -= 1
        if number < 0 or number >= len(value):
            return ""
        else:
            return value[number]
        
    # blok 14: dolžina X
    def operators_length(self, value: str) -> int:
        """
        Returns the length of a given string.

        Args:
            value (str): The string to get the length from.
        """
        return len(str(value))
    
    # blok 15: X1 vsebuje X2
    def operators_contains(self, value1: str, value2: str) -> bool:
        """
        Returns True if value1 contains value2.

        Args:
            value1 (str): The container string.
            value2 (str): The substring of the value1.
        """
        value1 = str(value1)
        value2 = str(value2)
        return value2 in value1
    
    # blok 16: zaokroži X
    def operators_round(self, number: float) -> int:
        """
        Returns the rounded number to the nearest integer.

        Args:
            number (float): The number to round.
        """
        try:
            number = float(number)
            return round(number)
        except Exception as e:
            print("Exception in operators_round.", e)
    
    # blok 17: [matematična operacija] od X
    def operators_math_operation_of(self, math_operation_option: str, number: float) -> float:
        """
        Returns the value with applied mathematical operation.

        Args:
            math_operation_option (str): An option from EnumMathOperation (absolute, round down, round up, square root, sin, cos, tan, arcsin, arccos, arctan, ln, log, e power, 10 power).
            number (float): The number on which the mathematical operation is applied on.
        """
        try:
            # when dealing with trigonometric functions, we need to convert the number to radians (Scratch calculates with degrees, Python with radians)
            number = float(number)
            option = EnumMathOperation(math_operation_option)
            if option == EnumMathOperation.ABSOLUTE:
                return abs(number)
            elif option == EnumMathOperation.FLOOR:
                return math.floor(number)
            elif option == EnumMathOperation.CEIL:
                return math.ceil(number)
            elif option == EnumMathOperation.SQRT:
                return math.sqrt(number)
            elif option == EnumMathOperation.SIN:
                rad = math.radians(number)
                return math.sin(rad)
            elif option == EnumMathOperation.COS:
                rad = math.radians(number)
                return math.cos(rad)
            elif option == EnumMathOperation.TAN:
                rad = math.radians(number)
                return math.tan(rad)
            elif option == EnumMathOperation.ARCSIN:
                rad = math.asin(number)
                deg = math.degrees(rad)
                return deg
            elif option == EnumMathOperation.ARCCOS:
                rad = math.acos(number)
                deg = math.degrees(rad)
                return deg
            elif option == EnumMathOperation.ARCTAN:
                rad = math.atan(number)
                deg = math.degrees(rad)
                return deg
            elif option == EnumMathOperation.LN:
                return math.log(number)
            elif option == EnumMathOperation.LOG:
                return math.log10(number)
            elif option == EnumMathOperation.E_POWER:
                return math.exp(number)
            elif option == EnumMathOperation.TEN_POWER:
                return math.pow(10, number)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
            return None
        
    
    # --- Spremenljivke ---

    # (variable)
    def variables_value(self, variable_name: str) -> int | float | str:
        """
        Returns the value of a variable with a given name.

        Args:
            variable_name (str): The name of the variable.
        """
        if variable_name in self._variables.keys():
            value = self._variables[variable_name]["value"]
            try:
                value = float(value)
                # Convert to int if it has no decimals
                if value.is_integer():
                    value = int(value)
            except ValueError as v:
                pass
            return value
        elif variable_name in self._game.stage._variables.keys():
            value = self._game.stage._variables[variable_name]["value"]
            try:
                value = float(value)
                # Convert to int if it has no decimals
                if value.is_integer():
                    value = int(value)
            except ValueError as v:
                pass
            return value
        elif variable_name in self._lists.keys() or variable_name in self._game.stage._lists.keys():
            return ""

    # blok 1: nastavi [X1, X2, ...] na X
    def variables_set_variable_to(self, variable_name: str, value: int | float | str) -> None:
        """
        Sets the variable with a given name to a given value.

        Args:
            variable_name (str): The name of the variable.
            value (int | float | str): The value to set the variable to.
        """
        # Rename and delete variable options get executed directly in Scratch, and do not remain as a block option in project, so we don't need to implement them
        # variables can't have the same name, even between those who are global and specific to sprite
        if variable_name in self._variables.keys():
            self._variables[variable_name]["value"] = value
        if variable_name in self._game.stage._variables.keys():
            self._game.stage._variables[variable_name]["value"] = value

    # blok 2: spremeni [X1, X2, ...] za X
    def variables_change_variable_for(self, variable_name: str, value: int | float | str) -> None:
        """
        Changes the variable with a given name for a given value. If the value is a string, sets the variable instead.

        Args:
            variable_name (str): The name of the variable.
            value (int | float | str): The value to set the variable to.
        """
        if variable_name in self._variables.keys():
            try:
                # value in variable is a number - change by
                self._variables[variable_name]["value"] = float(self._variables[variable_name]["value"]) + value
            except Exception as e:
                # value in variable is not a number - set to
                self._variables[variable_name]["value"] = value
        elif variable_name in self._game.stage._variables.keys():
            try:
                # value in variable is a number - change by
                self._game.stage._variables[variable_name]["value"] = float(self._game.stage._variables[variable_name]["value"]) + value
            except Exception as e:
                # value in variable is not a number - set to
                self._game.stage._variables[variable_name]["value"] = value

    # blok 3: pokaži spremenljivko [X1, X2, ...]
    def variables_show_variable(self, variable_name: str) -> None:
        """
        Shows the variable with given name and its value on screen.

        Args:
            variable_name (str): The name of the variable.
        """
        if variable_name in self._variables.keys():
            self._variables[variable_name]["visible"] = True
        if variable_name in self._game.stage._variables.keys():
            self._game.stage._variables[variable_name]["visible"] = True

    # blok 4: skrij spremenljivko [X1, X2, ...]
    def variables_hide_variable(self, variable_name: str) -> None:
        """
        Hides the variable with given name and its value from screen.

        Args:
            variable_name (str): The name of the variable.
        """
        if variable_name in self._variables.keys():
            self._variables[variable_name]["visible"] = False
        if variable_name in self._game.stage._variables.keys():
            self._game.stage._variables[variable_name]["visible"] = False

    # blok 5: dodaj X k [X1, X2, ...]
    def variables_add_element_to_list(self, element: int | float | str, list_name: str) -> None:
        """
        Appends the given element to the list with the given name.

        Args:
            element (int | float | str): An element to append to a list.
            list_name (str): The name of the list. 
        """
        if list_name in self._lists.keys():
            self._lists[list_name]["value"].append(element)
        if list_name in self._game.stage._lists.keys():
            self._game.stage._lists[list_name]["value"].append(element)

    # blok 6: zbriši 1 v [X1, X2, ...]
    def variables_remove_position_from_list(self, element_position: int, list_name: str) -> None:
        """
        Removes the element at a given position from the list with the given name.

        Args:
            element_position (int): The position of the element in list to be removed.
            list_name (str): The name of the list.
        """
        element_position -= 1 # convert from Scratch index to Python index
        if list_name in self._lists.keys():
            current_list = self._lists[list_name]["value"]
            if element_position >= 0 and element_position < len(current_list):
                current_list.pop(element_position)
        if list_name in self._game.stage._lists.keys():
            current_list = self._game.stage._lists[list_name]["value"]
            if element_position >= 0 and element_position < len(current_list):
                current_list.pop(element_position)

    # blok 7: zbriši vse v [X1, X2, ...]
    def variables_remove_all_from_list(self, list_name: str) -> None:
        """
        Removes all elements from the list with the given name.

        Args:
            list_name (str): The name of the list.
        """
        if list_name in self._lists.keys():
            self._lists[list_name]["value"].clear()
        if list_name in self._game.stage._lists.keys():
            self._game.stage._lists[list_name]["value"].clear()

    # blok 8: vstavi X na X v [X1, X2, ...]
    def variables_insert_element_at_position_in_list(self, element: int | float | str, element_position: int, list_name: str) -> None:
        """
        Inserts the given element at a given position in the list with the given name.

        Args:
            element (int | float | str): The element to be added to the list.
            element_position (int): The position in the list to add the element at.
            list_name (str): The name of the list.
        """
        element_position -= 1 # convert from Scratch index to Python index
        if list_name in self._lists.keys():
            current_list = self._lists[list_name]["value"]
            if element_position >= 0 and element_position < len(current_list):
                current_list.insert(element_position, element)
            elif element_position == len(current_list):
                current_list.append(element)
        if list_name in self._game.stage._lists.keys():
            current_list = self._game.stage._lists[list_name]["value"]
            if element_position >= 0 and element_position < len(current_list):
                current_list.insert(element_position, element)
            elif element_position == len(current_list):
                current_list.append(element)

    # blok 9: zamenjaj X v [X1, X2, ...] z X
    def variables_replace_position_in_list_with_element(self, element_position: int, list_name: str, element: int | float | str) -> None:
        """
        Replaces the element at a given position with the given element in the list with the given name.

        Args:
            element_position (int): The position in list to replace the element with.
            list_name (str): The name of the list.
            element (int | float | str): The new element that replaces the element at the given position.
        """
        element_position -= 1 # convert from Scratch index to Python index
        if list_name in self._lists.keys():
            current_list = self._lists[list_name]["value"]
            if element_position >= 0 and element_position < len(current_list):
                current_list[element_position] = element
        if list_name in self._game.stage._lists.keys():
            current_list = self._game.stage._lists[list_name]["value"]
            if element_position >= 0 and element_position < len(current_list):
                current_list[element_position] = element

    # blok 10: element X v [X1, X2, ...] (variable)
    def variables_element_at_position_in_list(self, element_position: int, list_name: str) -> int | float | str:
        """
        Returns the element at the given position in the list with the given name.

        Args:
            element_position (int): The position of the element to return from the list.
            list_name (str): The name of the list.
        """
        element_position -= 1 # convert from Scratch index to Python index
        if list_name in self._lists.keys():
            current_list = self._lists[list_name]["value"]
            if element_position >= 0 and element_position < len(current_list):
                return current_list[element_position]
            else:
                return None
        if list_name in self._game.stage._lists.keys():
            current_list = self._game.stage._lists[list_name]["value"]
            if element_position >= 0 and element_position < len(current_list):
                return current_list[element_position]
            else:
                return None
            
    # blok 11: predmet # od X v [X1, X2, ...] (variable)
    def variables_position_of_element_in_list(self, element: int | float | str, list_name: str) -> int:
        """
        Returns the position of the given element in the list with the given name.

        Args:
            element (int | float | str): The element to return the position of in the list.
            list_name (str): The name of the list.
        """
        if list_name in self._lists.keys():
            current_list = self._lists[list_name]["value"]
            if element in current_list:
                return current_list.index(element) + 1
            else:
                return 0
        if list_name in self._game.stage._lists.keys():
            current_list = self._game.stage._lists[list_name]["value"]
            if element in current_list:
                return current_list.index(element) + 1
            else:
                return 0
            
    # blok 12: dolžina [X1, X2, ...] (variable)
    def variables_length_of_list(self, list_name: str) -> int:
        """
        Returns the length of the list with the given name.

        Args:
            list_name (str): The name of the list.
        """
        if list_name in self._lists.keys():
            current_list = self._lists[list_name]["value"]
            return len(current_list)
        if list_name in self._game.stage._lists.keys():
            current_list = self._game.stage._lists[list_name]["value"]
            return len(current_list)
        
    # blok 13: Ali [X1, X2, ...] vsebuje X?
    def variables_list_contains_element(self, list_name: str, element: int | float | str) -> bool:
        """
        Returns True if the list with the given name contains the given element, else returns False.

        Args:
            list_name (str): The name of the list.
            element (int | float | str): The element to check if it's in the list.
        """
        if list_name in self._lists.keys():
            current_list = self._lists[list_name]["value"]
            return element in current_list
        if list_name in self._game.stage._lists.keys():
            current_list = self._game.stage._lists[list_name]["value"]
            return element in current_list
        
    # blok 14: pokaži seznam [X1, X2, ...]
    def variables_show_list(self, list_name: str) -> None:
        """
        Shows the list with given name and its content on screen.

        Args:
            list_name (str): The name of the list.
        """
        if list_name in self._lists.keys():
            self._lists[list_name]["visible"] = True
        if list_name in self._game.stage._lists.keys():
            self._game.stage._lists[list_name]["visible"] = True

    # blok 15: skrij seznam [X1, X2, ...]
    def variables_hide_list(self, list_name: str) -> None:
        """
        Hides the list with given name and its content from screen.

        Args:
            list_name (str): The name of the list.
        """
        if list_name in self._lists.keys():
            self._lists[list_name]["visible"] = False
        if list_name in self._game.stage._lists.keys():
            self._game.stage._lists[list_name]["visible"] = False

class Figure(Target):
    """Figure class for sprites that use blocks, it has its own scripts as dict of event types and list of scripts to execute. Some block methods are constructed entirely in JavaScript."""
    def __init__(self, game: Game, drawableId, name, startX, startY, startAngle, isVisible, startSize, rotateStyle: str, draggable, startingVariables, startingLists):
        super().__init__(game, startingVariables, startingLists)
        self._drawableId = drawableId
        self._name = name

        self._costumes: Dict[str, Image] = defaultdict(Image)
        self._currentCostumeName = ""
        self._costumeNames = [] # names in order

        self._angle = self._scratch_to_pygame_angle(startAngle)
        self._visible_angle = self._angle
        try:
            option = EnumRotateStyle(rotateStyle)
            self._rotateStyle = option
            if option == EnumRotateStyle.NO_ROTATE:
                self._visible_angle = 0
            elif option == EnumRotateStyle.LEFT_RIGHT:
                self._visible_angle = 0
                if(self._angle > 90 and self._angle < 270):
                    self._visible_angle = 180
        except ValueError:
            self._rotateStyle = EnumRotateStyle.AROUND

        # Scratch (0,0) is at the center, pygame (0,0) is at top left, so we need convert that, we also need to invert y (scratch y points up, pygame y points down)
        self._pos_x, self._pos_y = self._scratch_to_pygame_coords(startX, startY) # The center position of sprite's local coordinate system (in screen coords)

        self._original_sprite = None
        self._is_clone = False
        self._clones: List[Figure] = []

        self._speech = ""
        self._isSaying = False
        self._isThinking = False

        self._isVisible = isVisible
        self._scale_factor = self._scratch_to_pygame_scale(startSize)

        self._draggable = draggable
        if draggable:
            self._dragMode = EnumDragMode.DRAGGABLE
        else:
            self._dragMode = EnumDragMode.NOT_DRAGGABLE

    def _get_image_and_boudning_rect(self):
        """Applies transformations (scale, rotate, effects, translate) and returns image and bounding rectangles."""
        current_costume = self._current_costume()
        # Reset image with original image and rotiation center
        current_costume.image = current_costume.originalImage
        current_costume.rotation_center_x = current_costume.original_rotation_center_x
        current_costume.rotation_center_y = current_costume.original_rotation_center_y
        # Apply scaling
        self._scale(current_costume.image, current_costume, current_costume.rotation_center_x, current_costume.rotation_center_y)
        # Apply rotation (save the difference between previous size and size after rotating for futher calculation/normalization)
        width_before_rotate = current_costume.image.width
        height_before_rotate = current_costume.image.height
        self._rotate(current_costume.image, current_costume, current_costume.rotation_center_x, current_costume.rotation_center_y)
        width_after_rotate = current_costume.image.width
        height_after_rotate = current_costume.image.height
        current_costume.rotation_diff_x = (width_after_rotate - width_before_rotate) / 2
        current_costume.rotation_diff_y = (height_after_rotate - height_before_rotate) / 2
        # Apply image effects
        self._apply_effects(current_costume.image, current_costume)
        
        # Get image and bounding rect based on every applied transformation
        sprite_center_local_x, sprite_center_local_y = self._sprite_center()

        center_x = self._pos_x + sprite_center_local_x - current_costume.rotation_diff_x
        center_y = self._pos_y + sprite_center_local_y - current_costume.rotation_diff_y

        if(self._rotateStyle == EnumRotateStyle.AROUND):
            pivot_screen_x = self._pos_x
            pivot_screen_y = self._pos_y
            sprite_center_local_x = sprite_center_local_x - current_costume.rotation_diff_x
            sprite_center_local_y = sprite_center_local_y - current_costume.rotation_diff_y
            sprite_center_screen_x = pivot_screen_x + sprite_center_local_x
            sprite_center_screen_y = pivot_screen_y + sprite_center_local_y
            # Calculate the vector from the sprite center to the origin point in screen coordinates
            sprite_vector_x = sprite_center_screen_x - pivot_screen_x
            sprite_vector_y = sprite_center_screen_y - pivot_screen_y
            # Calculate the distance (hypotenuse) and angle of the vector
            distance = math.hypot(sprite_vector_x, sprite_vector_y)
            current_angle = math.atan2(sprite_vector_y, sprite_vector_x)
            # Find the new angle after rotation
            new_angle = current_angle - math.radians(self._angle) # "-" => counter-clockwise, + => clockwise (Scratch and pygame rotation directions are reversed)
            # Calculate the new center position of the sprite after rotation
            center_x = pivot_screen_x + distance * math.cos(new_angle)
            center_y = pivot_screen_y + distance * math.sin(new_angle)
        elif(self._rotateStyle == EnumRotateStyle.LEFT_RIGHT):
            if(self._angle > 90 and self._angle < 270):
                center_x = center_x - 2 * sprite_center_local_x
        
        # Create image and bounding rects
        image_rect = current_costume.image.get_rect(center=(center_x, center_y))
        # https://stackoverflow.com/questions/65361582/how-to-get-the-correct-dimensions-for-a-pygame-rectangle-created-from-an-image
        bounding_rect = current_costume.image.get_bounding_rect()
        bounding_rect.move_ip(image_rect.topleft) #ip means that it writes back to bounding_rect

        return (image_rect, bounding_rect)

    def _scratch_to_pygame_coords(self, sc_x, sc_y):
        """Converts scratch coordinates to pygame coordinates."""
        py_x = self._game.width // 2 + sc_x * self._game.scale_factor + self._game.right_margin
        py_y = self._game.height // 2 - sc_y * self._game.scale_factor + self._game.top_margin # negate y coord
        return (py_x, py_y)
    
    def _pygame_to_scratch_coords(self, py_x, py_y):
        """Converts pygame coordinates to scratch coordinates."""
        sc_x = (py_x - self._game.width // 2 - self._game.left_margin) / self._game.scale_factor
        sc_y = (- (py_y - self._game.height // 2 - self._game.top_margin)) / self._game.scale_factor
        return (sc_x, sc_y)
    
    def _scratch_to_pygame_scale(self, sc_scale):
        """Converts scratch scale to pygame scale."""
        # value is in percent (100% = 1x (original image), 200% = 2x (twice as large), 50% = 0.5x)
        py_scale = sc_scale / 100
        return py_scale
    
    def _pygame_to_scratch_scale(self, py_scale):
        """Converts pygame scale to scratch scale."""
        sc_scale = py_scale * 100
        return sc_scale
    
    def _scratch_to_pygame_angle(self, sc_angle):
        """Converts scratch angle to pygame angle."""
        # Scratch angles: 90 right, 0 up, -90 left, -180 = 180 down
        # Pygame angles: 0 right, 90 up, 180 left, 270 down
        # Pygame uses anticlockwise angles, Scratch uses clockwise angles
        sc_angle = self._normalize_scratch_angle(sc_angle)
        py_angle = (360 - sc_angle + 90) % 360
        return py_angle
    
    def _pygame_to_scratch_angle(self, py_angle):
        """Converts pygame angle to scratch angle."""
        sc_angle = (90 - py_angle) % 360
        if sc_angle > 180:
            sc_angle -= 360
        return sc_angle

    def _normalize_scratch_angle(self, angle):
        """Normalizes angle between -179 and 180."""
        newAngle = (angle + 180) % 360 - 180
        if(newAngle <= -180):
            newAngle = 180
        return newAngle
    
    def _normalize_python_angle(self, angle):
        """Normalizes angle between 0 and 359."""
        newAngle = angle % 360
        if newAngle < 0:
            newAngle += 360
        return newAngle

    def _set_position(self, new_pos_x, new_pos_y, spriteBoundaryOption: EnumSpriteBoundaries):
        """Sets the new position and checks if sprite is outside boundries."""
        self._pos_x = new_pos_x
        self._pos_y = new_pos_y
        self._contain_within_boundries(spriteBoundaryOption)

    def _set_angle(self, new_angle):
        """Sets and normalizes the angle."""
        new_angle = self._normalize_python_angle(new_angle)
        self._angle = new_angle
        self._visible_angle = self._angle
        if self._rotateStyle == EnumRotateStyle.NO_ROTATE:
            self._visible_angle = 0
        elif self._rotateStyle == EnumRotateStyle.LEFT_RIGHT:
            self._visible_angle = 0
            if(self._angle > 90 and self._angle < 270):
                self._visible_angle = 180

    def _sprite_center(self):
        """Returns the actual center of the sprite with rotation center applied in local coordinates."""
        # Add or subtract this value to switch between actual center of sprite and position of sprite.
        # Add to position of sprite => get actual center of sprite in screen coordinates
        # The actual center position of costume (in local coords)
        sprite_center_x = (self._current_costume().image.width / 2 - self._current_costume().rotation_center_x)
        sprite_center_y = (self._current_costume().image.height / 2 - self._current_costume().rotation_center_y)
        return (sprite_center_x, sprite_center_y)

    def _intersect(self, x, y):
        """Returns True if point (x, y) is within the bounding box of this figure, else returns False."""
        _, bounding_rect = self._get_image_and_boudning_rect()
        return bounding_rect.collidepoint(x, y)

    def _current_costume(self):
        """Returns the current costume."""
        return self._costumes[self._currentCostumeName]
    
    def _resize(self):
        """Resizes position of sprite when we click on resize button."""
        scaled_factor = self._game.scale_factors[1]
        if(self._game.scaled):
            # self._pos_x and _pos_y change
            self._pos_x = self._pos_x * scaled_factor - self._game.left_margin
            self._pos_y = self._pos_y * scaled_factor - self._game.top_margin
        else:
            # self._pos_x and _pos_y change
            self._pos_x = (self._pos_x + self._game.left_margin) / scaled_factor
            self._pos_y = (self._pos_y + self._game.top_margin) / scaled_factor

    def _scale(self, image: pygame.Surface, costume: Image, rot_cent_x, rot_cent_y):
        """Scales the costume of sprite."""
        # This also takes into account scale from resizing window.
        # pygame scales from topleft corner, if we want to resize from center, we need to recalculate the center after resizing
        width, height = image.get_size()
        scaled_width = int(width * self._scale_factor * self._game.scale_factor)
        scaled_height = int(height * self._scale_factor * self._game.scale_factor)
        scaled_image = pygame.transform.scale(image, (scaled_width, scaled_height))
        costume.image = scaled_image
        # Update rotation center (because the distance of topleft position of costume rectangle to center position of sprite changes)
        costume.rotation_center_x = rot_cent_x * self._scale_factor * self._game.scale_factor
        costume.rotation_center_y = rot_cent_y * self._scale_factor * self._game.scale_factor

    def _rotate(self, image: pygame.Surface, costume: Image, rot_cent_x, rot_cent_y):
        """Rotates or flips the costume of a sprite."""
        rotated_image = None
        if(self._rotateStyle == EnumRotateStyle.AROUND):
            # Rotate the sprite surface
            rotated_image = pygame.transform.rotate(image, self._angle)
        elif(self._rotateStyle == EnumRotateStyle.LEFT_RIGHT):
            # Start turned right
            rotated_image = pygame.transform.rotate(image, 0)
            # if angle turned left, flip to left
            if(self._angle > 90 and self._angle < 270):
                rotated_image = pygame.transform.flip(costume.image, flip_x=True, flip_y=False)
        elif(self._rotateStyle == EnumRotateStyle.NO_ROTATE):
            # stays turned right
            rotated_image = pygame.transform.rotate(image, 0)

        if rotated_image:
            costume.image = rotated_image
    
    def _contain_within_boundries(self, spriteBoundaryOption: EnumSpriteBoundaries):
        """Repositions the sprite if it's outside the drawing window boundries."""
        padding = round(16 * self._game.scale_factor)

        _, bounding_rect = self._get_image_and_boudning_rect()
        bounding_rect: pygame.Rect = bounding_rect

        # The actual center of the sprite
        center_x = bounding_rect.centerx
        center_y = bounding_rect.centery

        rect_w = bounding_rect.width
        rect_h = bounding_rect.height
        rect_w_half = rect_w/2
        rect_h_half = rect_h/2

        new_center_x = center_x
        new_center_y = center_y

        if(spriteBoundaryOption == EnumSpriteBoundaries.PARTIAL):
            # If width/2 or height/2 smaller then padding, then center becomes the border else only a padding of sprite is shown
            if(center_x > self._game.right_border and rect_w_half < padding):
                new_center_x = self._game.right_border
            elif(center_x > self._game.right_border + rect_w_half - padding and rect_w_half >= padding):
                new_center_x = self._game.right_border + rect_w_half - padding

            if(center_x < self._game.left_border and rect_w_half < padding):
                new_center_x = self._game.left_border
            elif(center_x < self._game.left_border - rect_w_half + padding and rect_w_half >= padding):
                new_center_x = self._game.left_border - rect_w_half + padding

            if(center_y < self._game.top_border and rect_h_half < padding):
                new_center_y = self._game.top_border
            elif(center_y < self._game.top_border - rect_h_half + padding and rect_h_half >= padding):
                new_center_y = self._game.top_border - rect_h_half + padding

            if(center_y > self._game.bottom_border and rect_h_half < padding):
                new_center_y = self._game.bottom_border
            elif(center_y > self._game.bottom_border + rect_h_half - padding and rect_h_half >= padding):
                new_center_y = self._game.bottom_border + rect_h_half - padding

        elif(spriteBoundaryOption == EnumSpriteBoundaries.CENTER):
            if(center_x > self._game.right_border):
                new_center_x = self._game.right_border
            if(center_x < self._game.left_border):
                new_center_x = self._game.left_border
            if(center_y < self._game.top_border):
                new_center_y = self._game.top_border
            if(center_y > self._game.bottom_border):
                new_center_y = self._game.bottom_border
        elif(spriteBoundaryOption == EnumSpriteBoundaries.FULL):
            if(center_x >= self._game.right_border - rect_w_half):
                new_center_x = self._game.right_border - rect_w_half
            if(center_x < self._game.left_border + rect_w_half):
                new_center_x = self._game.left_border + rect_w_half
            if(center_y < self._game.top_border + rect_h_half):
                new_center_y = self._game.top_border + rect_h_half
            if(center_y >= self._game.bottom_border - rect_h_half):
                new_center_y = self._game.bottom_border - rect_h_half

        self._pos_x = self._pos_x - (center_x - new_center_x)
        self._pos_y = self._pos_y - (center_y - new_center_y)
    
    def _create_my_clone(self):
        """Creates a clone of this sprite."""
        new_drawableId = max(self._game.drawList) + self._drawableId

        sc_x, sc_y = self._pygame_to_scratch_coords(self._pos_x, self._pos_y)
        sc_angle = self._pygame_to_scratch_angle(self._angle)
        sc_scale = self._pygame_to_scratch_scale(self._scale_factor)

        clone = Figure(self._game, new_drawableId, self._name, sc_x, sc_y, sc_angle, self._isVisible, sc_scale, self._rotateStyle, self._draggable, {}, {})
        clone._is_clone = True
        if not self._is_clone:
            clone._original_sprite = self
        else:
            clone._original_sprite = self._original_sprite

        new_events: Dict[int, List[Script]] = {}
        for event_type, scripts in self._scripts.items():
            new_scripts = []
            for script in scripts:
                new_script = Script(script.func, script.condition, script.conditionStaticArgs)
                new_script.isRunning = False
                new_script.target = clone
                new_scripts.append(new_script)
            new_events[event_type] = new_scripts
                
        clone._scripts = new_events

        # Maybe some other attributes need to be copied manually

        clone._sounds = self._sounds
        clone._soundNames = self._soundNames
        clone._soundsVolume = self._soundsVolume

        clone._currentLooksEffects = deepcopy(self._currentLooksEffects)
        
        clone._variables = deepcopy(self._variables)
        clone._lists = deepcopy(self._lists)
        clone._variables_names = deepcopy(self._variables_names)
        
        clone._costumes = deepcopy(self._costumes)
        clone._currentCostumeName = deepcopy(self._currentCostumeName)
        clone._costumeNames = self._costumeNames

        clone._dragMode = self._dragMode
        
        self._game.add_clone(self, clone)

        clone._set_scripts()

        clone._original_sprite._clones.append(clone)

        new_event = pygame.event.Event(EnumEventType.EVENT_START_CLONE.value, {"clone": clone})
        pygame.event.post(new_event)

    def _cancel_self(self):
        """When all scripts of this sprite are cancelled, reset some values to default ones."""
        self._isSaying = False
        self._isThinking = False
        # Remove all clones
        self._remove_clones()
    
    def _remove_clones(self):
        """Removes all clones of this sprite."""
        if not self._is_clone:
            for clone in self._clones:
                self._game.remove_clone(clone._drawableId, clone)
            self._clones.clear()


    # --- Gibanje ---

    # blok 1: pojdi X korakov
    def motion_move(self, steps: float) -> None:
        """
        Moves the sprite in the current direction for the given amount.

        Args:
            steps (float): The amount to move the sprite for.
        """
        try:
            steps = float(steps)
            radians = math.radians(self._visible_angle)
            dx = steps * math.cos(radians)
            dy = steps * math.sin(radians)

            new_pos_x = self._pos_x + dx * self._game.scale_factor
            new_pos_y = self._pos_y - dy * self._game.scale_factor # Subtract because Pygame's y-coordinates increase downward

            self._set_position(new_pos_x, new_pos_y, EnumSpriteBoundaries.PARTIAL)
        except Exception as e:
            print("Exception in motion_move.", e)

    # blok 2: obrni se za desno X stopinj
    def motion_rotate_right(self, angle: float) -> None:
        """
        Rotates the sprite to the right for a given angle.

        Args:
            angle (float): The angle that the sprite rotates for.
        """
        try:
            angle = float(angle)
            new_angle = self._angle - angle
            self._set_angle(new_angle)
        except Exception as e:
            print("Exception in motion_rotate_right.", e)

    # blok 3: obrni se za levo X stopinj
    def motion_rotate_left(self, angle: float) -> None:
        """
        Rotates the sprite to the left for a given angle.

        Args:
            angle (float): The angle that the sprite rotates for.
        """
        try:
            angle = float(angle)
            new_angle = self._angle + angle
            self._set_angle(new_angle)
        except Exception as e:
            print("Exception in motion_rotate_left.", e)

    # blok 4: pojdi na [naključno mesto, kazalec miške, X1, X2]
    def motion_go_to(self, go_to_option: str) -> None:
        """
        Moves the sprite the given option on the screen or the sprite with the given name.

        Args:
            go_to_option (str): An option from EnumGoTo (random place, mouse pointer) or the name of the sprite.
        """
        try:
            option = EnumGoTo(go_to_option)
            new_x = 0
            new_y = 0
            if(option == EnumGoTo.RANDOM):
                new_x = random.randint(self._game.left_border, self._game.right_border)
                new_y = random.randint(self._game.top_border, self._game.bottom_border)
            elif(option == EnumGoTo.MOUSE):
                mouse_x, mouse_y = pygame.mouse.get_pos()
                new_x = mouse_x
                new_y = mouse_y
            self._set_position(new_x, new_y, EnumSpriteBoundaries.CENTER)
        except ValueError as v:
            # The name of the sprite was given
            selected_figure = None
            for figure in self._game.figures[:]:
                if figure._name == go_to_option:
                    selected_figure = figure
                    break
            if not selected_figure:
                print("No figure with the name", go_to_option)
                return
            new_x = selected_figure._pos_x
            new_y = selected_figure._pos_y
            self._set_position(new_x, new_y, EnumSpriteBoundaries.PARTIAL)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
    
    # blok 5: pojdi na x: X y: X
    def motion_go_to_xy(self, x: int | float, y: int | float) -> None:
        """
        Moves the sprite to the given (x, y) position on the screen.

        Args:
            x (int | float): The x coordinate.
            y (int | float): The y coordinate.
        """
        try:
            # Scratch (0,0) is at the center, pygame (0,0) is at top left, so we need compensate that, we also need to invert y (scratch y points up, pygame y points down)
            x = float(x)
            y = float(y)
            new_x , new_y = self._scratch_to_pygame_coords(x, y)
            new_x = new_x
            new_y = new_y
            self._set_position(new_x, new_y, EnumSpriteBoundaries.PARTIAL)
        except Exception as e:
            print("Exception in motion_go_to_xy.", e)

    # blok 6: drsi X sekund do [naključnega mesta, kazalca miške, X1, X2, ...]
    async def motion_slide_to_async(self, seconds: float, go_to_option: str) -> None:
        """
        Slides the sprite to the given option on the screen or the sprite with the given name in the given amount of time.
        Note: you must add "await" before the method call.

        Args:
            seconds (float): The amount of time in seconds for the sprite to float.
            go_to_option (str): An option from EnumGoTo (random place, mouse pointer) or the name of the sprite.
        """
        try:
            seconds = float(seconds)
            start_x = self._pos_x
            start_y = self._pos_y
            end_x = 0
            end_y = 0

            option = EnumGoTo(go_to_option)

            if(option == EnumGoTo.RANDOM):
                end_x = random.randint(self._game.left_border, self._game.right_border)
                end_y = random.randint(self._game.top_border, self._game.bottom_border)
            elif(option == EnumGoTo.MOUSE):
                mouse_x, mouse_y = pygame.mouse.get_pos()
                end_x = mouse_x
                end_y = mouse_y

            start_time = time.time()
            
            while True:
                elapsed_time = time.time() - start_time
                # Calculate the interpolation factor
                t = min(elapsed_time/seconds, 1) # t ranges from 0 to 1 (if 1, then it's at the end)

                # Calculate the current position using linear interpolation
                new_x = start_x + (end_x - start_x) * t
                new_y = start_y + (end_y - start_y) * t
                self._set_position(new_x, new_y, EnumSpriteBoundaries.CENTER)

                await self._sleep(self._game.frameDuration)

                if(t >= 1):
                    break

            # Ensure the image ends exactly at the target position
            self._set_position(end_x, end_y, EnumSpriteBoundaries.CENTER)
        except ValueError as v:
            # The name of the sprite was given
            selected_figure = None
            for figure in self._game.figures[:]:
                if figure._name == go_to_option:
                    selected_figure = figure
                    break
            if not selected_figure:
                print("No figure with the name", go_to_option)
                return
            seconds = float(seconds)
            start_x = self._pos_x
            start_y = self._pos_y
            end_x = selected_figure._pos_x
            end_y = selected_figure._pos_y

            start_time = time.time()
            
            while True:
                elapsed_time = time.time() - start_time
                # Calculate the interpolation factor
                t = min(elapsed_time/seconds, 1) # t ranges from 0 to 1 (if 1, then it's at the end)

                # Calculate the current position using linear interpolation
                new_x = start_x + (end_x - start_x) * t
                new_y = start_y + (end_y - start_y) * t
                self._set_position(new_x, new_y, EnumSpriteBoundaries.CENTER)

                await self._sleep(self._game.frameDuration)

                if(t >= 1):
                    break

            # Ensure the image ends exactly at the target position
            self._set_position(end_x, end_y, EnumSpriteBoundaries.CENTER)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 7: drsi X sekund do x: X y: X
    async def motion_slide_to_xy_async(self, seconds: float, x: int | float, y: int) -> None:
        """
        Slides the sprite to the given (x, y) position on the screen in the given amount of time.
        Note: you must add "await" before the method call.

        Args:
            seconds (float): The amount of time in seconds for the sprite to float.
            x (int | float): The x coordinate.
            y (int | float): The y coordinate.
        """
        try:
            seconds = float(seconds)
            x = float(x)
            y = float(y)
            start_x = self._pos_x
            start_y = self._pos_y
            end_x, end_y = self._scratch_to_pygame_coords(x, y)

            start_time = time.time()
            
            while True:
                elapsed_time = time.time() - start_time
                # Calculate the interpolation factor
                t = min(elapsed_time/seconds, 1) # t ranges from 0 to 1 (if 1, then it's at the end)

                # Calculate the current position using linear interpolation
                new_x = start_x + (end_x - start_x) * t
                new_y = start_y + (end_y - start_y) * t

                self._set_position(new_x, new_y, EnumSpriteBoundaries.PARTIAL)

                await self._sleep(self._game.frameDuration)

                if(t >= 1):
                    break
            
            # Ensure the image ends exactly at the target position
            self._set_position(end_x, end_y, EnumSpriteBoundaries.PARTIAL)
        except Exception as e:
            print("Exception in motion_slide_to_xy_async.", e)

    # blok 8: obrni se v smer X
    def motion_rotate_to(self, angle: float) -> None:
        """
        Rotates the sprite in the given direction.

        Args:
            angle (float): The angle to rotate the sprite to.
        """
        try:
            angle = float(angle)
            new_angle = self._scratch_to_pygame_angle(angle)
            self._set_angle(new_angle)
        except Exception as e:
            print("Exception in motion_rotate_to.", e)

    # blok 9: obrni se proti [kazalcu miške, X1, X2, ...]
    def motion_rotate_towards(self, rotate_towards_option: str) -> str:
        """
        Rotates the sprite towards the given option. or the sprite with the given name

        Args:
            rotate_towards_option (str): An option from EnumRotateTowards (mouse pointer) or the name of the sprite.
        """
        try:
            option = EnumRotateTowards(rotate_towards_option)
            if(option == EnumRotateTowards.MOUSE):
                mouse_x, mouse_y = pygame.mouse.get_pos()
                center_x = self._pos_x
                center_y = self._pos_y

                # Calculate the angle between two points
                dx = mouse_x - center_x
                dy = mouse_y - center_y
                radians = math.atan2(dy, dx)
                degrees = - math.degrees(radians)
                self._set_angle(degrees)
        except ValueError as v:
            # The name of the sprite was given
            selected_figure = None
            for figure in self._game.figures[:]:
                if figure._name == rotate_towards_option:
                    selected_figure = figure
                    break
            if not selected_figure:
                print("No figure with the name", rotate_towards_option)
                return
            target_x = selected_figure._pos_x
            target_y = selected_figure._pos_y
            center_x = self._pos_x
            center_y = self._pos_y

            # Calculate the angle between two points
            dx = target_x - center_x
            dy = target_y - center_y
            radians = math.atan2(dy, dx)
            degrees = - math.degrees(radians)
            self._set_angle(degrees)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 10: spremeni x za X
    def motion_change_x_for(self, value: float) -> None:
        """
        Changes the x coordinate of a sprite for the given amount.

        Args:
            value (float): The amount to change the coordinate for.
        """
        try:
            value = float(value)
            new_x = self._pos_x + (value * self._game.scale_factor)
            self._set_position(new_x, self._pos_y, EnumSpriteBoundaries.PARTIAL)
        except Exception as e:
            print("Exception in motion_change_x_for.", e)

    # blok 11: nastavi x na X
    def motion_set_x_to(self, value: float) -> None:
        """
        Changes the x coordinate of a sprite to the given amount.

        Args:
            value (float): The amount to change the coordinate to.
        """
        try:
            value = float(value)
            new_x, _ = self._scratch_to_pygame_coords(value, 0)
            self._set_position(new_x, self._pos_y, EnumSpriteBoundaries.PARTIAL)
        except Exception as e:
            print("Exception in motion_set_x_to.", e)

    # blok 12: spremeni y za X
    def motion_change_y_for(self, value: float) -> None:
        """
        Changes the y coordinate of a sprite for the given amount.

        Args:
            value (float): The amount to change the coordinate for.
        """
        try:
            value = float(value)
            new_y = self._pos_y - (value * self._game.scale_factor)
            self._set_position(self._pos_x, new_y, EnumSpriteBoundaries.PARTIAL)    
        except Exception as e:
            print("Exception in motion_change_y_for.", e)


    # blok 13: nastavi y na X
    def motion_set_y_to(self, value: float) -> None:
        """
        Changes the y coordinate of a sprite for the given amount.

        Args:
            value (float): The amount to change the coordinate for.
        """
        try:
            value = float(value)
            _, new_y = self._scratch_to_pygame_coords(0, value)
            self._set_position(self._pos_x, new_y, EnumSpriteBoundaries.PARTIAL)
        except Exception as e:
            print("Exception in motion_set_y_to.", e)

    # blok 14: odbij se, če si na robu
    def motion_bounce_if_edge(self) -> None:
        """
        Bounces from the edge if it detects it.

        Args:
        """
        _, bounding_rect = self._get_image_and_boudning_rect()
        center_x, center_y = bounding_rect.center
        sprite_w, sprite_h = bounding_rect.size
        # Check for collision with edges and bounce
        bounce = False
        radians = math.radians(self._angle)
        dx = math.cos(radians)
        dy = -math.sin(radians)
        if(center_x < self._game.left_border + sprite_w / 2):
            # touch left border
            dx = abs(dx)
            bounce = True
        elif(center_x >= self._game.right_border - sprite_w / 2):
            # touch right border
            dx = 0 - abs(dx)
            bounce = True
        elif(center_y < self._game.top_border + sprite_h / 2):
            # touch top border
            dy = abs(dy)
            bounce = True
        elif(center_y >= self._game.bottom_border - sprite_h / 2):
            # touch bottom border
            dy = 0 - abs(dy)
            bounce = True
        
        if(bounce):
            # Negate dy to negate y coordinate
            newAngle = math.degrees(math.atan2(-dy, dx))
            self._set_angle(newAngle)
            # Just to reposition sprite to be within boundaries
            self._set_position(self._pos_x, self._pos_y, EnumSpriteBoundaries.FULL)

    # blok 15: Način vrtenja [levo-desno, ne zasukaj, na vse strani]
    def motion_change_rotate_style(self, rotate_style_option: str) -> None:
        """
        Changes the rotation style to the given option.

        Args:
            rotate_style_option (str): An option from EnumRotateStyle (around, left-right, no rotation).
        """
        try:
            option = EnumRotateStyle(rotate_style_option)
            self._rotateStyle = option
        except ValueError:
            self._rotateStyle = EnumRotateStyle.AROUND
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 16: položaj x (variable)
    def motion_position_x(self) -> float:
        """
        Returns the x coordinate of the sprite.

        Args:
        """
        sc_x, _ = self._pygame_to_scratch_coords(self._pos_x, self._pos_y)
        return sc_x
    
    # blok 17: položaj y (variable)
    def motion_position_y(self) -> float:
        """
        Returns the y coordinate of the sprite.

        Args:
        """
        _, sc_y = self._pygame_to_scratch_coords(self._pos_x, self._pos_y)
        return sc_y
    
    # blok 18: smer (variable)
    def motion_direction(self) -> float:
        """
        Returns the direction of the sprite.

        Args:
        """
        sc_angle = self._pygame_to_scratch_angle(self._angle)
        return sc_angle
    

    # --- Videzi ---
    
    # blok 1: reci X za X sekund
    async def looks_say_for_seconds_async(self, text: str, seconds: float) -> None:
        """
        Makes the sprite say the given text for a given amount of time.
        Note: you must add "await" before the method call.

        Args:
            text (str): The text to say.
            seconds (float): The amount of time in seconds for the text to appear on screen.
        """
        try:
            seconds = float(seconds)
            self._speech = str(text)
            self._isThinking = False
            self._isSaying = True
            await self._sleep(seconds)
            self._isSaying = False
            self._speech = ""
        except Exception as e:
            print("Exception in looks_say_for_seconds_async.", e)

    # blok 2: reci X
    def looks_say(self, text: str) -> None:
        """
        Makes the sprite say the given text.

        Args:
            text (str): The text to say.
        """
        self._speech = str(text)
        self._isThinking = False
        self._isSaying = True

    # blok 3: pomisli X za X sekund
    async def looks_think_for_seconds_async(self, text: str, seconds: float) -> None:
        """
        Makes the sprite think the given text for a given amount of time.
        Note: you must add "await" before the method call.

        Args:
            text (str): The text to think.
            seconds (float): The amount of time in seconds for the text to appear on screen.
        """
        try:
            seconds = float(seconds)
            self._speech = str(text)
            self._isSaying = False
            self._isThinking = True
            await self._sleep(seconds)
            self._isThinking = False
            self._speech = ""
        except Exception as e:
            print("Exception in looks_think_for_seconds_async.", e)

    # blok 4: pomisli X
    def looks_think(self, text: str) -> None:
        """
        Makes the sprite think the given text.

        Args:
            text (str): The text to think.
        """
        self._speech = str(text)
        self._isSaying = False
        self._isThinking = True

    # blok 5: spremeni videz v [X1, X2, ...]
    def looks_change_costume_to(self, costume_name: str) -> None:
        """
        Changes the costume of a sprite to the costume with the given name or to a costume with a given index.

        Args:
            costume_name (str): The name of the costume or the index of the costume to change to.
        """
        if costume_name in self._costumeNames:
            self._currentCostumeName = costume_name
        else:
            # Check if costume name is an integer or a float without decimals or if it can be converted to integer
            try:
                if isinstance(costume_name, int) or (isinstance(costume_name, float) and costume_name.is_integer()) or costume_name.isdigit():
                    num = int(costume_name)
                    num_costumes = len(self._costumeNames)
                    index = (num - 1) % num_costumes
                    self._currentCostumeName = self._costumeNames[index]
            except Exception as e:
                print("No costume with this name.", e)

    # blok 6: naslednji videz
    def looks_next_costume(self) -> None:
        """
        Changes the costume of a sprite to the next costume.

        Args:
        """
        currentCostumeIndx = self._costumeNames.index(self._currentCostumeName)
        nextCostumeIndx = (currentCostumeIndx + 1) % len(self._costumeNames)
        costume_name = self._costumeNames[nextCostumeIndx]
        self._currentCostumeName = costume_name

    # blok 9: spremeni velikost za X
    def looks_change_size_for(self, value: float) -> None:
        """
        Changes the size of the sprite for a given value.

        Args:
            value (float): The amount to change the size for.
        """
        try:
            value = float(value)
            py_scale = self._scratch_to_pygame_scale(value)
            new_scale = self._scale_factor + py_scale
            self._scale_factor = new_scale
        except Exception as e:
            print("Exception in looks_change_size_for.", e)

    # blok 10: nastavi velikost na X %
    def looks_change_size_to(self, value: float) -> None:
        """
        Changes the size of the sprite to a given value.

        Args:
            value (float): The amount to change the size to.
        """
        try:
            value = float(value)
            py_scale = self._scratch_to_pygame_scale(value)
            self._scale_factor = py_scale
        except Exception as e:
            print("Exception in looks_change_size_to.", e)

    # blok 14: pokaži
    def looks_show(self) -> None:
        """
        Shows the sprite on the screen.

        Args:
        """
        self._isVisible = True

    # blok 15: skrij
    def looks_hide(self) -> None:
        """
        Hides the sprite from the screen.

        Args:
        """
        self._isVisible = False
            
    # blok 16: pojdi na [spredaj, zadaj] plast
    def looks_go_to_layer(self, go_to_layer_option: str) -> None:
        """
        Moves the sprite to the back or the front based on the given layer option.

        Args:
            go_to_layer_option (str): An option from EnumGoToLayer (front, back).
        """
        try:
            option = EnumGoToLayer(go_to_layer_option)
            if option == EnumGoToLayer.FRONT:
                # remove and append the element at the back of the draw list
                if(self._drawableId in self._game.drawList):
                    self._game.drawList.remove(self._drawableId)
                self._game.drawList.append(self._drawableId)
            elif option == EnumGoToLayer.BACK:
                if(self._drawableId in self._game.drawList):
                    self._game.drawList.remove(self._drawableId)
                self._game.drawList.insert(0, self._drawableId)
        except ValueError as v:
            print("Unknown layer option value. Please try a different layer option.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 17: pojdi [naprej, nazaj] X plasti
    def looks_go_for_layers(self, go_for_layers_option: str, value: int) -> None:
        """
        Moves the sprite for the given amount of layers forward or backward based on the layer option.
        
        Args:
            go_for_layers_option (str): An option from EnumGoForLayers (forward, backward).
            value (int): The amount of layers to go forward or backward.
        """
        try:
            value = int(value)
            option = EnumGoForLayers(go_for_layers_option)
            if option == EnumGoForLayers.FORWARD:
                currentLayer = self._game.drawList.index(self._drawableId)
                nextLayer = currentLayer + value
                if(self._drawableId in self._game.drawList):
                    self._game.drawList.remove(self._drawableId)
                # clamp to 0 or len(list) - 1 if beyond range
                if nextLayer >= len(self._game.drawList):
                    self._game.drawList.append(self._drawableId)
                elif nextLayer <= 0:
                    self._game.drawList.insert(0, self._drawableId)
                else:
                    self._game.drawList.insert(nextLayer, self._drawableId)
            elif option == EnumGoForLayers.BACKWARD:
                currentLayer = self._game.drawList.index(self._drawableId)
                nextLayer = currentLayer - value
                if(self._drawableId):
                    self._game.drawList.remove(self._drawableId)
                # clamp to 0 or len(list) - 1 if beyond range
                if nextLayer >= len(self._game.drawList):
                    self._game.drawList.append(self._drawableId)
                elif nextLayer <= 0:
                    self._game.drawList.insert(0, self._drawableId)
                else:
                    self._game.drawList.insert(nextLayer, self._drawableId)
        except ValueError as v:
            print("Unknown layer option value. Please try a different layer option.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
    
    # blok 18: videz [število, ime] (variable)
    def looks_costume(self, costume_number_name_option: str) -> int | str:
        """
        Returns the given option of a costume.

        Args:
            costume_number_name_option (str): An option from EnumNumberName (number, name).
        """
        try:
            option = EnumNumberName(costume_number_name_option)
            if option == EnumNumberName.NUMBER:
                costumeIndex = self._costumeNames.index(self._currentCostumeName)
                return costumeIndex + 1
            elif option == EnumNumberName.NAME:
                return self._currentCostumeName
        except ValueError as v:
            print("Unknown option value. Please try a different option.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
    
    # blok 20: velikost (variable)
    def looks_size(self) -> float:
        """
        Returns the size of the sprite.

        Args:
        """
        sc_scale = round(self._pygame_to_scratch_scale(self._scale_factor))
        return sc_scale
    

    # --- Krmiljenje ---

    # blok 10: ustvari dvojnika [sebe, X1, X2, ...]
    def control_create_clone(self, clone_of_option: str) -> None:
        """
        Creates a clone of itself or a sprite with the given name.

        Args:
            clone_of_option (str): An option from EnumCloneOf (myself) or the name of a sprite.
        """
        try:
            # Current figure was selected to be cloned
            option = EnumCloneOf(clone_of_option)
            if option == EnumCloneOf.MYSELF:
                self._create_my_clone()
        except ValueError:
            # Specific figure was selected to be cloned
            for figure in self._game.figures[:]:
                if figure._name == clone_of_option and not figure._is_clone:
                    figure._create_my_clone()
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

    # blok 11: zbriši tega dvojnika
    def control_delete_clone(self) -> None:
        """
        Deletes current clone.

        Args:
        """
        original_sprite = self if not self._is_clone else self._original_sprite
        for clone in original_sprite._clones:
            if clone == self:
                self._game.remove_clone(clone._drawableId, clone)
                original_sprite._clones.remove(clone)


    # --- Zaznavanje ---

    # blok 1: se dotika [kazalca miške, roba, X1, X2, ...] ?
    def sensing_is_touching_object(self, touching_object_option: str) -> bool:
        """
        Returns True if a sprite is touching the given option, else returns False.

        Args:
            touching_object_option (str): An option from EnumTouchingObject (mouse pointer, edge) or the name of a sprite.
        """
        try:
            image_rect, bounding_rect = self._get_image_and_boudning_rect()
            option = EnumTouchingObject(touching_object_option)
            if option == EnumTouchingObject.MOUSE:
                mouse_x, mouse_y = pygame.mouse.get_pos()
                if self._intersect(mouse_x, mouse_y):
                    # We need to offset this, because get_at works on local coordinates of a Surface - (0, 0) is at top left corner of the image_rect
                    real_x = mouse_x - image_rect.left
                    real_y = mouse_y - image_rect.top
                    pixel_color = self._current_costume().image.get_at((real_x, real_y))
                    if pixel_color.a > 0:
                        return True
            elif option == EnumTouchingObject.EDGE:
                center_x, center_y = bounding_rect.center
                sprite_w, sprite_h = bounding_rect.size
                if(center_x < self._game.left_border + sprite_w / 2):
                    # touch left border
                    return True
                elif(center_x >= self._game.right_border - sprite_w / 2):
                    # touch right border
                    return True
                elif(center_y < self._game.top_border + sprite_h / 2):
                    # touch top border
                    return True
                elif(center_y >= self._game.bottom_border - sprite_h / 2):
                    # touch bottom border
                    return True
        except ValueError as v:
            # Option is a sprite name
            # If self not visible, then don't check
            if(not self._isVisible):
                return
            # Create a test surface, blit both sprites and check if they collide with pixel-perfect detection
            self_costume = self._current_costume()
            self_image_rect, _ = self._get_image_and_boudning_rect()
            figure_costume = None
            figure_image_rect = None
            # Find figure
            for drawableId in self._game.drawList[:]:
                figure = self._game.drawListFigures[drawableId]
                if figure._name == touching_object_option and figure._isVisible:
                    figure_costume = figure._current_costume()
                    figure_image_rect, _ = figure._get_image_and_boudning_rect()
                    break
            if not figure_image_rect or not figure_costume:
                return False
            else:
                self_mask = pygame.mask.from_surface(self_costume.image)
                figure_mask = pygame.mask.from_surface(figure_costume.image)
                # Offset is the relative position of figure_mask to self_mask
                offset = (figure_image_rect.x - self_image_rect.x, figure_image_rect.y - self_image_rect.y)
                # Check if the masks overlap
                if self_mask.overlap(figure_mask, offset):
                    return True
                else:
                    return False
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
        return False

    # blok 2: se dotika barve X ?
    def sensing_is_touching_color(self, target_color: str) -> bool:
        
        """
        Returns True if a sprite is touching a given color, else returns False.

        Args:
            target_color (str): The color in hex representation on screen.
        """
        # Create a test surface and blit background and other figures to it and then check if the touching color is the required color
        # We need a test surface in order to not take into account the current figure's color
        # mask is a surface of boolean values, where True means non-transparent pixel and False means transparent pixel of the image
        mask = pygame.mask.from_surface(self._current_costume().image)

        test_surface = pygame.Surface((self._game.width, self._game.height))
        test_surface.fill(EnumColors.WHITE.value)

        img = self._game.stage._current_backdrop().image
        img_rect, _ = self._game.stage._get_image_and_boudning_rect()
        img_rect_2 = deepcopy(img_rect)
        img_rect_2.left -= self._game.left_margin
        img_rect_2.top -= self._game.top_margin
        test_surface.blit(img, img_rect_2)

        for drawableId in self._game.drawList[:]:
            # don't include itself
            if drawableId == self._drawableId:
                continue
            figure = self._game.drawListFigures[drawableId]
            if(figure._isVisible):
                fig_image_rect, _ = figure._get_image_and_boudning_rect()
                currentCostume = figure._current_costume()
                img_rect_2 = deepcopy(fig_image_rect)
                img_rect_2.left -= self._game.left_margin
                img_rect_2.top -= self._game.top_margin
                test_surface.blit(currentCostume.image, img_rect_2)

        self_image_rect, _ = self._get_image_and_boudning_rect()
        image_rect_2 = deepcopy(self_image_rect)
        image_rect_2.left -= self._game.left_margin
        image_rect_2.top -= self._game.top_margin
        for x in range(self_image_rect.width):
            for y in range(self_image_rect.height):
                # Check if this pixel in the mask is non-transparent
                if mask.get_at((x, y)):
                    # Get the pixel color from the surface (screen or background) at sprite's position
                    screen_x = image_rect_2.x + x
                    screen_y = image_rect_2.y + y
                    if(screen_x < 0 or screen_y < 0 or screen_x >= self._game.width or screen_y >= self._game.height):
                        continue
                    pixel_color = test_surface.get_at((screen_x, screen_y))
                    pixel_color = pixel_color[:3] # change to RGB
                    hex_color = '#{:02x}{:02x}{:02x}'.format(pixel_color[0], pixel_color[1], pixel_color[2])
                    # Convert to RGB
                    hex_code = target_color.lstrip('#')
                    t_r = int(hex_code[0:2], 16)
                    t_g = int(hex_code[2:4], 16)
                    t_b = int(hex_code[4:6], 16)
                    h_r = pixel_color[0]
                    h_g = pixel_color[1]
                    h_b = pixel_color[2]
                    # Same color in Scratch and pygame may have slightly different values, so we introduce a small tolerance to them
                    tolerance = 5
                    # If the color matches the target color, return True
                    #if hex_color == target_color:
                    #    return True
                    if (abs(h_r - t_r) <= tolerance) and (abs(h_g - t_g) <= tolerance) and (abs(h_b - t_b) <= tolerance):
                        return True
        return False
    
    # blok 3: se barva X dotika X ?
    def sensing_is_color_touching_color(self, source_color_hex: str, target_color_hex: str) -> bool:
        """
        Returns True if a source color of a sprite is touching a given target color, else returns False.

        Args:
            source_color_hex (str): The color in hex representation on sprite.
            target_color_hex (str): The color in hex representation on screen.
        """
        # če se barva trenutnga sprite-a sourceColor dotika barve targetColor na screenu (podobn sensing_is_touching_color sam d gledaš še barvo z get_at from image)
        # Create a test surface and blit background and other figures to it and then check if the touching color is the required color
        # We need a test surface in order to not take into account the current figure's color
        mask = pygame.mask.from_surface(self._current_costume().image) # mask is a surface of boolean values, where True means non-transparent pixel and False means transparent pixel of the image

        test_surface = pygame.Surface((self._game.width, self._game.height))
        test_surface.fill(EnumColors.WHITE.value)

        img = self._game.stage._current_backdrop().image
        img_rect, _ = self._game.stage._get_image_and_boudning_rect()
        img_rect_2 = deepcopy(img_rect)
        img_rect_2.left -= self._game.left_margin
        img_rect_2.top -= self._game.top_margin
        test_surface.blit(img, img_rect_2)

        for drawableId in self._game.drawList[:]:
            # don't include itself
            if drawableId == self._drawableId:
                continue
            figure = self._game.drawListFigures[drawableId]
            if(figure._isVisible):
                fig_image_rect, _ = figure._get_image_and_boudning_rect()
                currentCostume = figure._current_costume()
                img_rect_2 = deepcopy(fig_image_rect)
                img_rect_2.left -= self._game.left_margin
                img_rect_2.top -= self._game.top_margin
                test_surface.blit(currentCostume.image, img_rect_2)

        self_image_rect, _ = self._get_image_and_boudning_rect()
        image_rect_2 = deepcopy(self_image_rect)
        image_rect_2.left -= self._game.left_margin
        image_rect_2.top -= self._game.top_margin

        for x in range(self_image_rect.width):
            for y in range(self_image_rect.height):
                # Check if this pixel in the mask is non-transparent
                if mask.get_at((x, y)):
                    # Get the pixel color from the surface (screen or background) at sprite's position (need to displace by image x,y in order to take color from the figures position)
                    screen_x = image_rect_2.x + x
                    screen_y = image_rect_2.y + y
                    if(screen_x < 0 or screen_y < 0 or screen_x >= self._game.width or screen_y >= self._game.height):
                        continue
                    pixel_color_screen = test_surface.get_at((screen_x, screen_y))
                    pixel_color_screen = pixel_color_screen[:3] # change to RGB
                    hex_color_screen = '#{:02x}{:02x}{:02x}'.format(pixel_color_screen[0], pixel_color_screen[1], pixel_color_screen[2])
                    screen_r = pixel_color_screen[0]
                    screen_g = pixel_color_screen[1]
                    screen_b = pixel_color_screen[2]
                    # Get the pixel color from the figure
                    pixel_color_sprite = self._current_costume().image.get_at((x, y))
                    pixel_color_sprite = pixel_color_sprite[:3] # change to RGB
                    hex_color_sprite = '#{:02x}{:02x}{:02x}'.format(pixel_color_sprite[0], pixel_color_sprite[1], pixel_color_sprite[2])
                    sprite_r = pixel_color_screen[0]
                    sprite_g = pixel_color_screen[1]
                    sprite_b = pixel_color_screen[2]

                    hex_code = source_color_hex.lstrip('#')
                    source_r = int(hex_code[0:2], 16)
                    source_g = int(hex_code[2:4], 16)
                    source_b = int(hex_code[4:6], 16)
                    hex_code = target_color_hex.lstrip('#')
                    target_r = int(hex_code[0:2], 16)
                    target_g = int(hex_code[2:4], 16)
                    target_b = int(hex_code[4:6], 16)
                    # Same color in Scratch and pygame may have slightly different values, so we introduce a small tolerance to them
                    tolerance = 5
                    # If the sprite color matches the source color and screen color matches the target color then return True
                    if (abs(sprite_r - source_r) <= tolerance) and (abs(sprite_g - source_g) <= tolerance) and (abs(sprite_b - source_b) <= tolerance) and (abs(screen_r - target_r) <= tolerance) and (abs(screen_g - target_g) <= tolerance) and (abs(screen_b - target_b) <= tolerance):
                        return True
        return False
    
    # blok 4: razdalja do [kazalca miške, X1, X2, ...]
    def sensing_distance_to(self, distance_to_option: str) -> float:
        """
        Returns the distance to the mouse pointer or a sprite with the given name.

        Args:
            distance_to_option (str): An option from EnumDistanceTo (mouse pointer) or the name of a sprite.
        """
        try:
            option = EnumDistanceTo(distance_to_option)
            if option == EnumDistanceTo.MOUSE:
                mouse_x, mouse_y = pygame.mouse.get_pos()
                # contain mouse to draw window (like Scratch)
                if mouse_x < self._game.left_border:
                    mouse_x = self._game.left_border
                elif mouse_x > self._game.right_border - 1:
                    mouse_x = self._game.right_border - 1
                if mouse_y < self._game.top_border:
                    mouse_y = self._game.top_border
                elif mouse_y > self._game.bottom_border - 1:
                    mouse_y = self._game.bottom_border - 1
                pos_x = self._pos_x
                pos_y = self._pos_y

                distance = math.sqrt(((pos_x - mouse_x) / self._game.scale_factor)**2 + ((pos_y - mouse_y) / self._game.scale_factor)**2)
                return distance
        except ValueError:
            # Distance is a specific sprite name
            own_pos_x = self._pos_x
            own_pos_y = self._pos_y
            target_pos_x, target_pos_y = 0, 0
            for figure in self._game.figures[:]:
                if figure._name == distance_to_option:
                    target_pos_x = figure._pos_x
                    target_pos_y = figure._pos_y

            distance = math.sqrt(((target_pos_x - own_pos_x) / self._game.scale_factor)**2 + ((target_pos_y - own_pos_y) / self._game.scale_factor)**2)
            return distance
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()
        
    # blok 5: vprašaj X in počakaj
    async def sensing_ask_and_wait_async(self, text: str) -> None:
        """
        Makes the sprite ask a given text and wait for user to answer.
        Note: you must add "await" before the method call.

        Args:
            text (str): The text to ask. 
        """
        # If one target has already asked, then keep the ask dialog on that target
        if(self._game.isAsking):
            return
        
        text = str(text)
        
        # Create an input box using pygame_gui
        self._game.answered = False

        container_box_left_margin = container_box_right_margin = container_box_bottom_margin = 10
        container_box_width = self._game.width - container_box_left_margin - container_box_right_margin
        container_box_height = 90

        panel_box_left_margin = panel_box_right_margin = 15
        panel_box_bottom_margin = panel_box_top_margin = 15
        panel_box_height = 40
        panel_box_width = container_box_width - panel_box_left_margin - panel_box_right_margin

        container_box_height = panel_box_bottom_margin + panel_box_height + panel_box_top_margin
        container_box_left = self._game.left_border + container_box_left_margin
        container_box_top = self._game.bottom_border - container_box_height - container_box_bottom_margin

        panel_box_left = panel_box_left_margin
        panel_box_top = panel_box_top_margin

        panel_container_rect = pygame.Rect(container_box_left, container_box_top, container_box_width, container_box_height)
        self._ask_panel = pygame_gui.elements.UIPanel(panel_container_rect, manager=self._game.manager, object_id="#ask_panel_container")

        panel_box_rect = pygame.Rect(panel_box_left, panel_box_top, panel_box_width, panel_box_height)
        panel_box = pygame_gui.elements.UIPanel(panel_box_rect, manager=self._game.manager, container=self._ask_panel, object_id="#ask_panel_idle")

        button_box_radius = 34

        input_box_margin_left, input_box_margin_right, input_box_margin_top, input_box_margin_bottom = 15, 20, 5, 5
        input_box_width, input_box_height = panel_box_width - input_box_margin_left - input_box_margin_right - button_box_radius, panel_box_height
        # because we put these elements in container, the positions are relative to that container
        input_box_rect = pygame.Rect(input_box_margin_left, input_box_margin_top, input_box_width + button_box_radius/2, input_box_height - input_box_margin_top - input_box_margin_bottom)
        ask_input = pygame_gui.elements.UITextEntryLine(input_box_rect, manager=self._game.manager, container=panel_box, object_id="#ask_input")

        button_box_rect = pygame.Rect(input_box_rect.right, input_box_rect.top - 2, button_box_radius, button_box_radius)
        ask_button = pygame_gui.elements.UIButton(button_box_rect, manager=self._game.manager, text="OK", container=panel_box, object_id="#ask_button")

        input_focused = False

        self._isSaying = True
        self._speech = str(text)
        self._game.isAsking = True

        previousScaled = self._game.scaled

        while True:
            if(self._game.scaled != previousScaled):
                # if we scale when input window is open, change locations of panel
                self._ask_panel.set_position((panel_container_rect.left, self._game.bottom_border - container_box_height - container_box_bottom_margin))

                container_box_width = self._game.width - container_box_left_margin - container_box_right_margin
                new_size = (container_box_width, panel_container_rect.height)
                self._ask_panel.set_dimensions(new_size)

                panel_box_width = container_box_width - panel_box_left_margin - panel_box_right_margin
                new_size = (panel_box_width, panel_box_rect.height)
                panel_box.set_dimensions(new_size)

                input_box_width = panel_box_width - input_box_margin_left - input_box_margin_right - button_box_radius/2
                new_size = (input_box_width, input_box_rect.height)
                ask_input.set_dimensions(new_size)

                ask_button.set_relative_position((ask_input.relative_rect.right, input_box_rect.top - 2))

                previousScaled = self._game.scaled
            
            button_hovered = ask_button.check_hover(self._game.frameDuration, False)
            panel_hovered = panel_box.check_hover(self._game.frameDuration, False)

            if not input_focused:
                if panel_hovered and not button_hovered:
                    panel_box.change_object_id("#ask_panel_hovered")
                    if(self._game.mousePressed):
                        panel_box.change_object_id("#ask_panel_focused")
                        ask_input.focus()
                        input_focused = True
                else:
                    panel_box.change_object_id("#ask_panel_idle")
            else:
                if not panel_hovered and not button_hovered:
                    if(self._game.mousePressed):
                        panel_box.change_object_id("#ask_panel_idle")
                        input_focused = False

            if ask_button.check_pressed():
                self._game.answered = True
                self._game.answerText = ask_input.text
                self._game.isAsking = False

            if(self._game.answered):
                self._answerText = self._game.answerText
                self._ask_panel.kill()
                self._isSaying = False
                self._speech = ""
                break

            await self._sleep(self._game.frameDuration)
    
    # blok 11: Možnost premika naj bo [možno, ne moremo] premikati
    def sensing_drag_mode(self, drag_mode_option: str) -> None:
        """
        Sets the sprite drag mode to the given option.

        Args:
            drag_mode_option (str): An option from EnumDragMode (draggable, not draggable).
        """
        try:
            option = EnumDragMode(drag_mode_option)
            self._dragMode = option
            if(option == EnumDragMode.DRAGGABLE):
                self._draggable = True
            elif(option == EnumDragMode.NOT_DRAGGABLE):
                self._draggable = False
        except ValueError as v:
            print("Unknown drag option value. Please try a different drag option.", v)
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

class Stage(Target):
    """Stage class for stage and backdrops. Some block methods are constructed entirely in JavaScript."""
    def __init__(self, game: Game, startingVariables, startingLists):
        super().__init__(game, startingVariables, startingLists)
        self._backdrops: Dict[str, Image] = defaultdict(Image)
        self._currentBackdropName = ""
        self._backdropNames = [] # names in order

    def _resize(self):
        """Resizes backdrop when resize button is clicked."""
        pass
    
    def _current_backdrop(self):
        """Returns the current backdrop."""
        return self._backdrops[self._currentBackdropName]
    
    def _scale(self, image: pygame.Surface, backdrop: Image, rot_cent_x, rot_cent_y):
        """Scales the backdrop."""
        # This also takes into account scale from resizing window.
        width, height = image.get_size()
        scaled_width = int(width * self._game.scale_factor)
        scaled_height = int(height * self._game.scale_factor)
        scaled_image = pygame.transform.scale(image, (scaled_width, scaled_height))
        backdrop.image = scaled_image
        backdrop.rotation_center_x = rot_cent_x * self._game.scale_factor
        backdrop.rotation_center_y = rot_cent_y * self._game.scale_factor

    def _get_image_and_boudning_rect(self):
        """Applies transformations (scale, effects) and returns image and bounding rectangles."""
        current_backdrop = self._current_backdrop()
        current_backdrop.image = current_backdrop.originalImage
        current_backdrop.rotation_center_x = current_backdrop.original_rotation_center_x
        current_backdrop.rotation_center_y = current_backdrop.original_rotation_center_y
        # Apply scale
        self._scale(current_backdrop.originalImage, current_backdrop, current_backdrop.rotation_center_x, current_backdrop.rotation_center_y)
        # Apply effects
        self._apply_effects(current_backdrop.image, current_backdrop)

        # Create image and bounding rects (always puts it on center)
        center_x = self._game.width//2 + self._game.left_margin
        center_y = self._game.height//2 + self._game.top_margin
        topleft_x = center_x - current_backdrop.rotation_center_x
        topleft_y = center_y - current_backdrop.rotation_center_y
        image_rect = current_backdrop.image.get_rect(topleft=(topleft_x, topleft_y))
        bounding_rect = current_backdrop.image.get_bounding_rect()
        bounding_rect.move_ip(image_rect.topleft)
        return (image_rect, bounding_rect)
    
    def _cancel_self(self):
        """When all scripts are cancelled, resets some values with default ones."""
        pass


    # --- Videzi ---

    # blok 2: zamenjaj ozadje na [X1, X2, ..., naslednje ozadje, prejšnje ozadje, naključno ozadje] in počakaj
    async def looks_change_backdrop_to_and_wait_async(self, backdrop_option: str) -> None:
        """
        Changes the backdrop to a backdrop with a given name or a given option and waits for all scripts to finish that have waited on this backdrop to appear.
        Note: you must add "await" before the method call.

        Args:
            backdrop_option (str): The name of a backdrop or an option from EnumBackdropChangeTo (next, previous, random).
        """
        try:
            # Convert the string to the corresponding Enum (if backdropOption in EnumBackdropChangeTo)
            option = EnumBackdropChangeTo(backdrop_option)

            if option == EnumBackdropChangeTo.NEXT:
                currentBackdropIndx = self._backdropNames.index(self._currentBackdropName)
                nextBackdropIndx = (currentBackdropIndx + 1) % len(self._backdropNames)
                self._currentBackdropName = self._backdropNames[nextBackdropIndx]
            elif option == EnumBackdropChangeTo.PREVIOUS:
                currentBackdropIndx = self._backdropNames.index(self._currentBackdropName)
                previousBackdropIndx = (currentBackdropIndx - 1) % len(self._backdropNames)
                self._currentBackdropName = self._backdropNames[previousBackdropIndx]
            elif option == EnumBackdropChangeTo.RANDOM:
                newBackdropIndx = random.randint(0, len(self._backdropNames) - 1)
                self._currentBackdropName = self._backdropNames[newBackdropIndx]
                
        except ValueError:
            # if backdropOption not in EnumBackdropChangeTo, then backdropOption is a specific backdropname
            self._currentBackdropName = backdrop_option if backdrop_option in self._backdropNames else self._currentBackdropName
        except Exception as e:
            print("Exception:", e)
            traceback.print_exc()

        # Trigger event
        new_event = pygame.event.Event(EnumEventType.EVENT_BACKDROP_CHANGED.value, {"backdropChangeName": self._currentBackdropName})
        pygame.event.post(new_event)

        # Check which scripts were started by this change of backdrop, and wait for all of them to finish
        backdrop_change_scripts: List[Script] = []
        # Take keys and make a copy in case if subscribers dict changes meanwhile
        for target in list(self._game.subscribers.keys()):
            events = self._game.subscribers[target]
            if not EnumEventType.EVENT_BACKDROP_CHANGED.value in events:
                continue
            backdrop_change_scripts_list = events[EnumEventType.EVENT_BACKDROP_CHANGED.value]
            for script in backdrop_change_scripts_list:
                if script.check_condition({"currentBackdropName": self._currentBackdropName}):
                    script.started_by_backdrop_change = True
                    backdrop_change_scripts.append(script)
        # break loop when all scripts change started_by_backdrop_change to False
        while True:
            cancel = True
            for script in backdrop_change_scripts:
                if script.started_by_backdrop_change:
                    cancel = False
                    break
            if cancel:
                break
            await self._sleep(self._game.frameDuration)


    # --- Krmiljenje ---

    # blok 10: ustvari dvojnika [X1, X2, ...]
    def control_create_clone(self, clone_of_name: str) -> None:
        """
        Creates a clone of a sprite with a given name.

        Args:
            clone_of_name (str): The name of a sprite to be cloned.
        """
        # Specific figure was selected to be cloned
        for figure in self._game.figures[:]:
            if figure._name == clone_of_name and not figure._is_clone:
                figure._create_my_clone()


    # --- Zaznavanje ---

    # blok 5: vprašaj X in počakaj
    async def sensing_ask_and_wait_async(self, text: str) -> None:
        """
        Makes the stage ask a given text and wait for user to answer.
        Note: you must add "await" before the method call.

        Args:
            text (str): The text to ask. 
        """
        # If one target has already asked, then keep the ask dialog on that target
        if(self._game.isAsking):
            return
        
        text = str(text)
        
        # Create an input box using pygame_gui
        self._game.answered = False

        container_box_left_margin = container_box_right_margin = container_box_bottom_margin = 10
        container_box_width = self._game.width - container_box_left_margin - container_box_right_margin
        container_box_height = 90

        panel_box_left_margin = panel_box_right_margin = 15
        panel_box_bottom_margin = panel_box_top_margin = 15
        panel_box_height = 40
        panel_box_width = container_box_width - panel_box_left_margin - panel_box_right_margin

        panel_label_top_margin = 15
        panel_label_left_margin = panel_box_left_margin
        panel_label_right_margin = panel_box_right_margin
        panel_label_bottom_margin = 10
        panel_label_total_height = 0
        panel_label_width = panel_box_width

        lines = []
        if(text):
            # if text not empty, then container_box_height will be larger
            # 1. Split speech/text into lines, so it is within max with of the bubble

            font = self._game.manager.ui_theme.get_font(["#ask_label_text"])
            words = text.split(' ')
            current_line = ""
            for word in words:
                # Try adding the word to the current line
                test_line = current_line + word + " "
                text_width, _ = font.size(test_line)
                # If the line exceeds the max width, move the current line to lines
                if text_width > panel_box_width and current_line:
                    lines.append(current_line.strip())
                    current_line = word + " "  # Start a new line
                else:
                    current_line = test_line
            # Append any remaining text in the current line
            if current_line:
                lines.append(current_line.strip())

            text_height = sum([font.size(line)[1] for line in lines])
            panel_label_total_height = text_height

        container_box_height = panel_box_bottom_margin + panel_box_height + panel_label_total_height + panel_label_bottom_margin + panel_label_top_margin
        container_box_height = container_box_height - panel_label_bottom_margin if not lines else container_box_height
        container_box_left = self._game.left_border + container_box_left_margin
        container_box_top = self._game.bottom_border - container_box_height - container_box_bottom_margin

        panel_box_left = panel_box_left_margin
        panel_box_top = panel_label_top_margin + panel_label_total_height + panel_label_bottom_margin
        panel_box_top = panel_box_top - panel_label_bottom_margin if not lines else panel_box_top

        panel_container_rect = pygame.Rect(container_box_left, container_box_top, container_box_width, container_box_height)
        self._ask_panel = pygame_gui.elements.UIPanel(panel_container_rect, manager=self._game.manager, object_id="#ask_panel_container")

        # We do this because UILabel is just made for one line
        panel_label_left = panel_label_left_margin
        panel_label_top = panel_label_top_margin
        for line in lines:
            panel_label_rect = pygame.Rect(panel_label_left, panel_label_top, panel_label_width, panel_label_total_height/len(lines))
            panel_label = pygame_gui.elements.UILabel(panel_label_rect, line, manager=self._game.manager, container=self._ask_panel, object_id="#ask_label_text")
            panel_label_top += panel_label_total_height/len(lines)

        panel_box_rect = pygame.Rect(panel_box_left, panel_box_top, panel_box_width, panel_box_height)
        panel_box = pygame_gui.elements.UIPanel(panel_box_rect, manager=self._game.manager, container=self._ask_panel, object_id="#ask_panel_idle")

        button_box_radius = 34

        input_box_margin_left, input_box_margin_right, input_box_margin_top, input_box_margin_bottom = 15, 20, 5, 5
        input_box_width, input_box_height = panel_box_width - input_box_margin_left - input_box_margin_right - button_box_radius, panel_box_height
        # because we put these elements in container, the positions are relative to that container
        input_box_rect = pygame.Rect(input_box_margin_left, input_box_margin_top, input_box_width + button_box_radius/2, input_box_height - input_box_margin_top - input_box_margin_bottom)
        ask_input = pygame_gui.elements.UITextEntryLine(input_box_rect, manager=self._game.manager, container=panel_box, object_id="#ask_input")

        button_box_rect = pygame.Rect(input_box_rect.right, input_box_rect.top - 2, button_box_radius, button_box_radius)
        ask_button = pygame_gui.elements.UIButton(button_box_rect, manager=self._game.manager, text="OK", container=panel_box, object_id="#ask_button")

        input_focused = False

        self._game.isAsking = True

        previousScaled = self._game.scaled

        while True:
            if(self._game.scaled != previousScaled):
                # if we scale when input window is open, change locations of panel
                self._ask_panel.set_position((panel_container_rect.left, self._game.bottom_border - container_box_height - container_box_bottom_margin))

                container_box_width = self._game.width - container_box_left_margin - container_box_right_margin
                new_size = (container_box_width, panel_container_rect.height)
                self._ask_panel.set_dimensions(new_size)

                panel_box_width = container_box_width - panel_box_left_margin - panel_box_right_margin
                new_size = (panel_box_width, panel_box_rect.height)
                panel_box.set_dimensions(new_size)

                input_box_width = panel_box_width - input_box_margin_left - input_box_margin_right - button_box_radius/2
                new_size = (input_box_width, input_box_rect.height)
                ask_input.set_dimensions(new_size)

                ask_button.set_relative_position((ask_input.relative_rect.right, input_box_rect.top - 2))

                previousScaled = self._game.scaled
            
            button_hovered = ask_button.check_hover(self._game.frameDuration, False)
            panel_hovered = panel_box.check_hover(self._game.frameDuration, False)

            if not input_focused:
                if panel_hovered and not button_hovered:
                    panel_box.change_object_id("#ask_panel_hovered")
                    if(self._game.mousePressed):
                        panel_box.change_object_id("#ask_panel_focused")
                        ask_input.focus()
                        input_focused = True
                else:
                    panel_box.change_object_id("#ask_panel_idle")
            else:
                if not panel_hovered and not button_hovered:
                    if(self._game.mousePressed):
                        panel_box.change_object_id("#ask_panel_idle")
                        input_focused = False

            if ask_button.check_pressed():
                self._game.answered = True
                self._game.answerText = ask_input.text
                self._game.isAsking = False

            if(self._game.answered):
                self._answerText = self._game.answerText
                self._ask_panel.kill()
                break

            await self._sleep(self._game.frameDuration)

class Script:
    """Script class that handles each script."""
    def __init__(self, func: Callable[[Union[Figure, Stage]], Coroutine[Any, Any, None]], condition: Callable[..., bool] = None, conditionStaticArgs: Dict[str, Any] = {}) -> None:
        # Callable[..., bool] => function that takes any number of arguments of any type and returns a bool (Callable[[int, int] bool] => takes 2 ints and returns a bool)
        # Union[Figure, Stage] => target can be of type Figure or Stage
        self.func = func
        self.target: Union[Stage, Figure] = None
        self.condition = condition
        self.conditionStaticArgs = conditionStaticArgs  # Static arguments known at task creation

        self.scriptId = str(uuid.uuid4())
        self.task: asyncio.Task = None
        self.isRunning = False

        self.started_by_broadcast = False
        self.started_by_backdrop_change = True

    def check_condition(self, conditionDynamicArgs: Dict[str, Any] = {}) -> bool:
        """Checks if condition to run the script is satisfied."""
        if(self.condition is None):
            return True
        allArgs = {**self.conditionStaticArgs, **conditionDynamicArgs}  # Merge static and dynamic arguments (all arguments are named, so we don't have troubles when calling the condition)
        return self.condition(**allArgs)
    
    def start_script(self) -> None:
        """Starts the script."""
        self.isRunning = True
        self.task = asyncio.create_task(self.func(self.target))
        self.task.add_done_callback(self.task_finsihed)

    def task_finsihed(self, task: asyncio.Task) -> None:
        """Resets some values when the script is finished."""
        self.isRunning = False
        self.started_by_broadcast = False
        self.started_by_backdrop_change = False

    async def cancel_script(self):
        """Cancels the script."""
        if self.task and self.isRunning:
           # If task not done yet
            if not self.task.done():
                # if task.cancel() returns True, then request to cancel was successfull (wait for the task to completley cancel), otherwise the task was already done (finished before cancellation or already cancelled)
                if self.task.cancel():
                    try:
                        # wait for the task to be completley cancelled (cancel exception propagated)
                        await self.task
                        self.isRunning = False
                        self.started_by_broadcast = False
                        self.started_by_backdrop_change = False
                    except asyncio.CancelledError:
                        # If task gets cancelled (recieves CancelledError), reset values and raise an error up
                        self.isRunning = False
                        self.started_by_broadcast = False
                        self.started_by_backdrop_change = False
                        raise 
                    except Exception as e:
                        traceback.print_exc()

class EventSystem:
    """EventSystem class that handles recieved events."""
    def __init__(self, game: Game):
        self.game = game

    async def dispatch_event(self, event_type: int, event: pygame.event.Event):
        """Dispatches the event."""
        # if event_type is STOP, then cancel all scripts and return (this is global for all targets)
        if event_type == EnumEventType.EVENT_STOP.value:
            await self.handle_event_stop()
            return

        # if event_type is START, then cancel all scripts before starting new ones
        if event_type == EnumEventType.EVENT_START.value:
            await self.handle_event_stop()

        # If there are any new subscribers, add them to subscribers dict
        if self.game.new_subscribers:
            self.game.subscribers.update(self.game.new_subscribers)
            self.game.new_subscribers.clear()

        # for each figure and event_type, process scripts
        # We make a copy of keys of dict, in case if subscribers change size, the keys will remain as they are.
        # If we await and give other functions time to run, then we have to check if subscriber is in subscribers in the next iteration.
        for subscriber in list(self.game.subscribers.keys()):
            events = []
            if subscriber in self.game.subscribers:
                events = self.game.subscribers[subscriber]
            # if subscriber subscribed to this particular event
            if(event_type in events):
                await self.handle_event(event_type, event, subscriber, events[event_type])

    def start_scripts(self, scripts: List[Script]):
        """Starts all scripts from the list."""
        # list of scripts is already connected to specific target to specific event
        for script in scripts:
            script.start_script()

    async def cancel_all_scripts(self):
        """Cancels all scripts."""
        # Need to be a list (a.k.a. copy of the original dict, because of removing clones from subscribers - original size of dict changes)
        for subscriber in list(self.game.subscribers.keys()):
            events = {}
            if subscriber in self.game.subscribers:
                events = self.game.subscribers[subscriber]
            for event_type, scripts in events.items():
                for script in scripts:
                    try:
                        await script.cancel_script()
                    except asyncio.CancelledError:
                        pass
            subscriber._cancel() # cancels/resets some values that dont need to be displayed

    async def cancel_scripts(self, scripts: List[Script]):
        """Cancels all scripts from the list."""
        for script in scripts:
            try:
                await script.cancel_script()
            except asyncio.CancelledError:
                pass

    async def cancel_own_script(self, script: Script):
        """Cancels only own script (for control stop EnumStop.THIS_SCRIPT, need extra to propagate error up)."""
        try:
            await script.cancel_script()
        except asyncio.CancelledError:
            raise

    async def handle_event(self, event_type: int, event: pygame.event.Event, subscriber: Union[Figure, Stage], scripts: List[Script]):
        """Handles the event - a list of scripts that belong to a specific sprite that belongs to a specific event."""
        # click on start flag (Control 1)
        if event_type == EnumEventType.EVENT_START.value:
            await self.handle_event_start(event_type, event, subscriber, scripts)

        # on button press (Control 2)
        elif event_type == EnumEventType.EVENT_BUTTON_PRESSED.value:
            await self.handle_event_button_pressed(event_type, event, subscriber, scripts)

        # click on figure (Control 3)
        elif event_type == EnumEventType.EVENT_FIGURE_CLICKED.value and event.dict["figureClickedId"] == subscriber._drawableId:
            await self.handle_event_figure_clicked(event_type, event, subscriber, scripts)

        # click on stage (Control 3)
        elif event_type == EnumEventType.EVENT_BACKDROP_CLICKED.value:
            await self.handle_event_backdrop_clicked(event_type, event, subscriber, scripts)
        
        # backdrop change (Control 4)
        elif event_type == EnumEventType.EVENT_BACKDROP_CHANGED.value:
            await self.handle_event_backdrop_changed(event_type, event, subscriber, scripts)

        # event (loduness / timer) exceeded (Control 5)
        elif event_type == EnumEventType.EVENT_EXCEEDED.value:
            await self.handle_event_exceeded(event_type, event, subscriber, scripts)

        # broadcast (message) recieved (Control 6)
        elif event_type == EnumEventType.EVENT_BROADCAST_RECIEVED.value:
            await self.handle_event_broadcast_recieved(event_type, event, subscriber, scripts)

        # start as a clone ()
        elif event_type == EnumEventType.EVENT_START_CLONE.value and subscriber._is_clone and event.dict["clone"] == subscriber:
            await self.handle_event_start_clone(event_type, event, subscriber, scripts)

    async def handle_event_start(self, event_type, event: pygame.event.Event, subscriber, scripts: List[Script]):
        """When start event is recieved."""
        # Start scripts (of current subscriber of current event_type)
        if(not scripts):
            return
        self.start_scripts(scripts)

    async def handle_event_button_pressed(self, event_type, event: pygame.event.Event, subscriber, scripts: List[Script]):
        """When button pressed event is recieved."""
        if(not scripts):
            return
        btnPressed = event.dict["buttonPressedId"]
        scriptsToRun = []
        for script in scripts:
            if not script.isRunning:
                if(script.check_condition({"pressedButton": btnPressed})):
                    scriptsToRun.append(script)
        self.start_scripts(scriptsToRun)

    async def handle_event_figure_clicked(self, event_type, event: pygame.event.Event, subscriber, scripts: List[Script]):
        """When sprite clicked event is recieved."""
        if(not scripts):
            return
        await self.cancel_scripts(scripts)
        self.start_scripts(scripts)

    async def handle_event_backdrop_clicked(self, event_type, event: pygame.event.Event, subscriber, scripts: List[Script]):
        """When backdrop clicked event is recieved."""
        if(not scripts):
            return
        await self.cancel_scripts(scripts)
        self.start_scripts(scripts)

    async def handle_event_backdrop_changed(self, event_type, event: pygame.event.Event, subscriber, scripts: List[Script]):
        """When backdrop changed event is recieved."""
        if(not scripts):
            return
        currentBackdropName = event.dict["backdropChangeName"]
        scriptsToRun = []
        for script in scripts:
            if not script.isRunning:
                if(script.check_condition({"currentBackdropName": currentBackdropName})):
                    scriptsToRun.append(script)
        await self.cancel_scripts(scriptsToRun)
        self.start_scripts(scriptsToRun)

    async def handle_event_exceeded(self, event_type, event: pygame.event.Event, subscriber, scripts: List[Script]):
        """When event exceeded (timer, loudness) event is recieved."""
        if(not scripts):
            return
        timer = event.dict["timer"]
        loudness = event.dict["loudness"]
        currentLoudness = event.dict["currentLoudness"]
        previousLoudness = event.dict["previousLoudness"]
        currentTimer = event.dict["currentTimer"]
        previousTimer = event.dict["previousTimer"]
        scriptsToRun = []
        for script in scripts:
            if not script.isRunning:
                if(script.check_condition({"timer": timer, "currentTimer": currentTimer, "previousTimer": previousTimer, "loudness": loudness, "currentLoudness": currentLoudness, "previousLoudness": previousLoudness})):
                    scriptsToRun.append(script)
        await self.cancel_scripts(scriptsToRun)
        self.start_scripts(scriptsToRun)

    async def handle_event_broadcast_recieved(self, event_type, event: pygame.event.Event, subscriber, scripts: List[Script]):
        """When broadcast recieved event is recieved."""
        if(not scripts):
            return
        broadcastValue = event.dict["broadcastValue"]
        scriptsToRun = []
        for script in scripts:
            if(script.check_condition({"broadcastValue": broadcastValue})):
                scriptsToRun.append(script)
        await self.cancel_scripts(scriptsToRun)
        self.start_scripts(scriptsToRun)

    async def handle_event_start_clone(self, event_type, event: pygame.event.Event, subscriber, scripts: List[Script]):
        """When clone started event is recieved."""
        if(not scripts):
            return
        await self.cancel_scripts(scripts)
        #scriptsToRun = []
        #for script in scripts:
        #    if not script.isRunning:
        #        scriptsToRun.append(script)
        self.start_scripts(scripts)

    async def handle_event_stop(self):
        """When stop event is recieved."""
        await self.cancel_all_scripts()

# region Conditions
# --- Functions that check if event conditions are met - these functions are passed as parameters to Script ---
def condition_event_button_pressed(pressedButton: int, requiredButton: str):
    if(not buttons[requiredButton]):
        # required button is "any" button (value is None) -> just check if pressedButton is in dict of all buttons
        return pressedButton and pressedButton in buttons.values()
    else:
        # required button is a specific button -> check if pressedButton is equal to the required button value
        return pressedButton and buttons[requiredButton] == pressedButton
def condition_event_figure_clicked(figureClickedId: str, currentFigureId: str):
    return figureClickedId == currentFigureId
def condition_event_backdrop_changed(currentBackdropName: Image, requiredBackdropName: Image):
    return currentBackdropName == requiredBackdropName
def condition_event_exceeded(timer: str, currentTimer: float, previousTimer: float, loudness: str, currentLoudness: float, previousLoudness: float, requiredEvent: str, requiredValue: float):
    if requiredEvent == timer:
        return previousTimer < requiredValue and currentTimer > requiredValue
    elif requiredEvent == loudness:
        return previousLoudness < requiredValue and currentLoudness > requiredValue
    else:
        return False
def condition_event_broadcast_recieved(broadcastValue: str, requiredBroadcastValue: str):
    return broadcastValue == requiredBroadcastValue
# endregion

# region Examples
# --- Examples of blocks ---

# --- MOTION BLOCKS ---
# target.motion_move(10) # blok 1
# target.motion_rotate_right(15) # blok 2
# target.motion_rotate_left(15) # blok 3
# target.motion_go_to(EnumGoTo.MOUSE.value) # blok 4
# target.motion_go_to_xy(100, 100) # blok 5
# await target.motion_slide_to_async(2, EnumGoTo.MOUSE.value) # blok 6
# await target.motion_slide_to_xy_async(1, 100, 100) # blok 7
# target.motion_rotate_to(180) # blok 8
# target.motion_rotate_towards(EnumRotateTowards.MOUSE.value) # blok 9
# target.motion_change_x_for(10) # blok 10
# target.motion_set_x_to(10) # blok 11
# target.motion_change_y_for(10) # blok 12
# target.motion_set_y_to(10) # blok 13
# target.motion_bounce_if_edge() # blok 14
# target.motion_change_rotate_style(EnumRotateStyle.LEFT_RIGHT.value) # blok 15
# target.motion_position_x() # block 16 (variable)
# target.motion_position_y() # block 17 (variable)
# target.motion_direction() # block 18 (variable)

# --- LOOKS BLOCKS ---
# await target.looks_say_for_seconds_async("say", 2) # blok 1
# target.looks_say("say") # blok 2
# await target.looks_think_for_seconds_async("think", 2) # blok 3
# target.looks_think("think") # blok 4
# target.looks_change_costume_to("preobleka2") # blok 5
# target.looks_next_costume() # blok 6
# target.looks_change_backdrop_to(EnumBackdropChangeTo.NEXT.value) # blok 7
# await target.looks_change_backdrop_to_and_wait_async(EnumBackdropChangeTo.NEXT.value) # blok 2 (stage)
# target.looks_next_backdrop() # blok 8
# target.looks_change_size_for(10) # blok 9
# target.looks_change_size_to(200) # blok 10
# target.looks_change_effect_for(EnumLooksEffect.COLOR.value, 20) # blok 11 # NOT IMPLEMENTED
# target.looks_set_effect_to(EnumLooksEffect.COLOR.value, 20) # blok 12 # NOT IMPLEMENTED
# target.looks_remove_effects() # blok 13 # NOT IMPLEMENTED
# target.looks_show() # blok 14
# target.looks_hide() # blok 15
# target.looks_go_to_layer(EnumGoToLayer.FRONT.value) # blok 16
# target.looks_go_for_layers(EnumGoForLayers.FORWARD.value, 2) # blok 17
# target.looks_costume(EnumNumberName.NUMBER.value) # blok 18 (variable)
# target.looks_backdrop(EnumNumberName.NUMBER.value) # blok 19 (variable)
# target.looks_size() # blok 20 (variable)

# --- SOUND BLOCKS ---
# await target.sound_play_sound_until_done_async("Mijav") # blok 1
# target.sound_play_sound("Mijav") # blok 2
# target.sound_stop_all_sounds() # blok 3
# target.sound_change_effect_for(EnumSoundEffect.PITCH.value, 10) # blok 4 # NOT IMPLEMENTED
# target.sound_change_effect_to(EnumSoundEffect.PITCH.value, 20) # blok 5 # NOT IMPLEMENTED
# target.sound_remove_effects() # blok 6 # NOT IMPLEMENTED
# target.sound_change_volume_for(-50) # blok 7
# target.sound_change_volume_to(20) # blok 8
# target.sound_volume() # blok 9

# --- EVENTS BLOCKS ---
# target.events_broadcast("sporočilo1") # blok 7
# await target.events_broadcast_wait_async("sporočilo1") # blok 8

# --- CONTROL BLOCKS ---
# await target.control_wait_async(2) # blok 1
# for i in range(10): # blok 2
#     await target._sleep(target._game.frameDuration)
# while True: # blok 3
#     await target._sleep(target._game.frameDuration)
# if(): # blok 4
# if(): # blok 5
# else:
# while not(): # blok 6
#     await target._sleep(target._game.frameDuration)
# while not(): # blok 7
#     await target._sleep(target._game.frameDuration)
# await target.control_stop_async(EnumStop.ALL.value) # blok 8
# target.control_create_clone(EnumCloneOf.MYSELF.value) # blok 10 (or "Abby")
# target.control_delete_clone() # blok 11

# --- SENSING BLOCKS ---
# target.sensing_is_touching_object(EnumTouchingObject.MOUSE.value) # blok 1
# target.sensing_is_touching_color("#2fa64a") # blok 2
# target.sensing_is_color_touching_color("#ffffff", "#2fa64a") # blok 3
# target.sensing_distance_to(EnumDistanceTo.MOUSE.value) # blok 4
# await target.sensing_ask_and_wait_async("Kako ti je ime?") # blok 5
# target.sensing_answer() # blok 6 (variable)
# target.sensing_is_button_held("space") # blok 7
# target.sensing_is_mouse_held() # blok 8
# target.sensing_mouse_x() # blok 9 (variable)
# target.sensing_mouse_y() # blok 10 (variable)
# target.sensing_drag_mode(EnumDragMode.DRAGGABLE.value) # blok 11
# target.sensing_loudness() # blok 12 (variable)
# target.sensing_timer() # blok 13 (variable)
# target.sensing_reset_timer() # blok 14
# target.sensing_variable_from(EnumVariable.POSITION_X.value, "Cat") #target.sensing_variable_from("my_var", EnumVariableFrom.STAGE.value) # blok 15 (variable)
# target.sensing_current(EnumCurrent.YEAR.value) # blok 16 (variable)
# target.sensing_days_sice_2000() # blok 17 (variable)
# target.sensing_username() # blok 18 (variable)

# --- OPERATORS BLOCKS ---
# ( + ) # blok 1
# ( - ) # blok 2
# ( * ) # blok 3
# ( / ) # blok 4
# target.operators_random_number(1, 10) # blok 5
# target.operators_greater_than(1, 10) # blok 6
# target.operators_less_than(1, 10) # blok 7
# target.operators_equals(1, 10) # blok 8
# ( and ) # blok 9
# ( or ) # blok 10
# (not ) # blok 11
# target.operators_concatenate("jabolko ", "banana") # blok 12
# target.operators_letter_in(1, "jabolko") # blok 13
# target.operators_length("jabolko") # blok 14
# target.operators_contains("jabolko", "j") # blok 15
# ( % ) # blok 16
# target.operators_round(1.5) # blok 17
# target.operators_math_operation_of(EnumMathOperation.ABSOLUTE.value, 2) # blok 18

# --- VARIABLES BLOCK ---
# target.variables_value("my_var") (variable)
# target.variables_set_variable_to("my_var", 50) # blok 1
# target.variables_change_variable_for("my_var", 1) # blok 2
# target.variables_show_variable("my_var") # blok 3
# target.variables_hide_variable("my_var") # blok 4
# target.variables_add_element_to_list("abc", "my_list") # blok 5
# target.variables_remove_position_from_list(1, "my_list") # blok 6
# target.variables_remove_all_from_list("my_list") # blok 7
# target.variables_insert_element_at_position_in_list("new", 1, "my_list") # blok 8
# target.variables_replace_position_in_list_with_element(1, "my_list", "replaced") # blok 9
# target.variables_element_at_position_in_list(1, "my_list") # blok 10 (variable)
# target.variables_position_of_element_in_list("abc", "my_list") # blok 11 (variable)
# target.variables_length_of_list("my_list") # blok 12 (variable)
# target.variables_list_contains_element("my_list", "abc") # blok 13
# target.variables_show_list("my_list") # blok 14
# target.variables_hide_list("my_list") # blok 15

#endregion

# region Scripts
# --- All async coroutines that have scripts of blocks (in loops always use await target._sleep(target._game.frameDuration) at the end, to yield control to main loop) ---
# // --- Dynamically created scripts in JavaScript (#DYNAMIC) --- //

{#scripts}

# // --- End of dynamically created scripts in JavaScript (#DYNAMIC) --- //
# endregion

# Entrypoint of the program
if __name__ == '__main__':
    game = Game()
    asyncio.run(game.main())
`

// Export the object
export { originalPythonCode };