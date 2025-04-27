import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SparklyUpgradeButton from '@/components/ui/upgradeButton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    WandSparkles,
    Sparkles,
    Gem,
    FolderPlus,
    Trash,
    User,
    MessageCirclePlus,
    Coffee,
    LogOut,
    ChevronDown
} from 'lucide-react';

const TopBar = memo(({
    newTaskTitle,
    onNewTaskTitleChange,
    onAddNode,
    hideCompleted,
    setHideCompleted,
    highlightNext,
    setHighlightNext,
    minimapOn,
    setMinimapOn,
    backgroundOn,
    setBackgroundOn,
    snapToGridOn,
    setSnapToGridOn,
    onAutoArrange,
    onFitView,
    currentProject,
    projects,
    onProjectChange,
    onCreateProject,
    onDeleteProject,
    user,
    onLogout,
    generativeMode,
    setGenerativeMode,
    showUpDownstream,
    setShowUpDownstream,
}) => {
    return (
        <div className="p-2 border-1 border-neutral-200 flex flex-wrap items-center space-x-2">
            <div className="flex items-center space-x-2">
                <Input
                    placeholder="New task title..."
                    value={newTaskTitle}
                    onChange={(e) => onNewTaskTitleChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onAddNode(null); }}
                    className="max-w-xs mr-0 rounded-r-none"
                />
                <Button onClick={() => onAddNode(null)} className="rounded-l-none">
                    <Plus />
                </Button>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        View Options <ChevronDown size={16} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem checked={hideCompleted} onCheckedChange={setHideCompleted}>
                        Hide Completed
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={highlightNext} onCheckedChange={setHighlightNext}>
                        Highlight Next
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={minimapOn} onCheckedChange={setMinimapOn}>
                        Show Minimap
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={backgroundOn} onCheckedChange={setBackgroundOn}>
                        Show Background
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={snapToGridOn} onCheckedChange={setSnapToGridOn}>
                        Snap to Grid
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showUpDownstream} onCheckedChange={setShowUpDownstream}>
                        Show Upstream/Downstream
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => {
                onAutoArrange();
                onFitView(); // Enable fit view after auto-arranging
            }}>
                <WandSparkles /> Auto Arrange
            </Button>
            {
                user.premium ? (
                    <Button variant="outline" onClick={(e) => setGenerativeMode(!generativeMode)}>
                        <Sparkles /> Generate
                    </Button>
                ) : (
                    <>
                    </>
                    // <SparklyUpgradeButton onClick={() => window.alert("Feature coming soon!")}>
                    //     <Gem className="text-purple-500" /> Upgrade
                    // </SparklyUpgradeButton>
                )
            }

            <div className="ml-auto flex items-center space-x-2">
                <select
                    className="
                        rounded-md text-sm font-medium transition-all
                        disabled:pointer-events-none disabled:opacity-50
                        px-4 py-2
                        border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground
                        dark:bg-input/30 dark:border-input dark:hover:bg-input/50
                        outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]
                    "
                    value={currentProject || ''}
                    onChange={(e) => onProjectChange(e.target.value)}
                >
                    {projects.map(project => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </select>
                <Button variant="outline" onClick={onCreateProject}>
                    <FolderPlus /> New
                </Button>
                <Button variant="destructive" onClick={onDeleteProject}>
                    <Trash />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <User /> {user.username}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a
                                href="https://github.com/Shreeyam/treetrack/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageCirclePlus /> Feature Request
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a
                                href="https://ko-fi.com/shreeyam"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Coffee /> Tip Jar
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onLogout} className="text-destructive">
                            <LogOut /> Logout
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled className="opacity-50">
                            Treetrack v0.1.2<br />{BUILD_DATE}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
});

TopBar.displayName = 'TopBar';
export default TopBar;