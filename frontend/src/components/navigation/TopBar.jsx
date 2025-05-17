import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    FolderPlus,
    FolderMinus,
    User,
    LogOut,
    ChevronDown,
    CircleHelp,
    Eye,
    ChevronsUpDown,
} from 'lucide-react';
import { siDiscord } from 'simple-icons';
import UserIcon from '@/components/ui/userIcon';

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
                <Button onClick={() => onAddNode(null)} className="rounded-l-none" title="Add New Task">
                    <Plus />
                </Button>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center" title="View Options">
                        <Eye className="md:hidden" size={16} />
                        <span className="hidden md:inline">View Options</span>
                        <ChevronDown size={16} className="ml-1" />
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

            <Button
                variant="outline"
                onClick={() => {
                    onAutoArrange();
                    onFitView(); // Enable fit view after auto-arranging
                }}
                className="flex items-center"
                title="Auto Arrange"
            >
                <WandSparkles className="h-4 w-4" />
                <span className="hidden md:inline">Auto Arrange</span>
            </Button>
            {
                user.premium ? (
                    <Button
                        variant="outline"
                        onClick={(e) => setGenerativeMode(!generativeMode)}
                        className="flex items-center"
                        title="Generate"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden md:inline">Generate</span>
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
                <Button variant="outline">
                    {projects.filter(p => p.id === currentProject)[0]?.name}
                    <ChevronsUpDown className="h-4 w-4" />
                </Button>
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
                    title="Select Project"
                >
                    {projects.map(project => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </select>
                <Button
                    variant="outline"
                    onClick={onCreateProject}
                    className="flex items-center"
                    title="Create New Project"
                >
                    <FolderPlus className="h-4 w-4" />
                    <span className="hidden md:inline">New</span>
                </Button>
                <Button
                    variant="destructive"
                    onClick={onDeleteProject}
                    className="flex items-center"
                    title="Delete Project"
                >
                    <FolderMinus className="h-4 w-4" />
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" title="Keyboard Shortcuts">
                            <CircleHelp />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                        <h3 className="text-sm font-semibold mb-2">Keyboard Shortcuts</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between">
                                <span>Link/unlink tasks</span>
                                <span>
                                    <kbd className="px-1 py-0.5 border rounded">Shift</kbd> +{" "}
                                    <kbd className="px-1 py-0.5 border rounded">Click</kbd>
                                </span>
                            </li>
                            <li className="flex justify-between">
                                <span>Select multiple</span>
                                <span>
                                    <kbd className="px-1 py-0.5 border rounded">Ctrl</kbd> +{" "}
                                    <kbd className="px-1 py-0.5 border rounded">Click</kbd>
                                </span>
                            </li>
                            <li className="flex justify-between">
                                <span>Select box</span>
                                <span>
                                    <kbd className="px-1 py-0.5 border rounded">Ctrl</kbd> +{" "}
                                    <kbd className="px-1 py-0.5 border rounded">Drag</kbd>
                                </span>
                            </li>
                            <li className="flex justify-between">
                                <span>Delete task</span>
                                <span>
                                    <kbd className="px-1 py-0.5 border rounded">Delete</kbd>
                                </span>
                            </li>
                        </ul>
                    </PopoverContent>
                </Popover>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="flex items-center"
                            title="User Menu"
                        >
                            <UserIcon user={user} />
                            <span className="hidden md:inline">{user.name}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a
                                href="https://discord.gg/BNpkcWCxGX"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center"
                            >
                                <div
                                    className="h-4 w-4"
                                    dangerouslySetInnerHTML={{
                                        __html: siDiscord.svg.replace('role="img" viewBox', 'role="img" width="16" height="16" fill="#737373" viewBox')
                                    }}
                                />
                                Feature Request
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href="/account">
                                <User /> Account Settings
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onLogout} className="text-destructive">
                            <LogOut /> Logout
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled className="opacity-50">
                            Treetrack v0.1.5<br />{BUILD_DATE}<br />{BUILD_COMMIT_HASH}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
});

TopBar.displayName = 'TopBar';
export default TopBar;